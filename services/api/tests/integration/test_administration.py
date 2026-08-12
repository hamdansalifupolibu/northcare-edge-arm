from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from tests.helpers import auth_headers, register_device

PROFILE_FIELDS = {
    "profession": "communityHealthOfficer",
    "communityRequestsEnabled": True,
    "emergencyRequestsEnabled": False,
}


async def _admin_headers(client: AsyncClient) -> dict[str, str]:
    return await auth_headers(client, "dev-admin-001", "AdminDemo1!")


@pytest.mark.asyncio
async def test_worker_cannot_access_admin_routes(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    resp = await api_client.get("/v1/admin/accounts", headers=headers)
    assert resp.status_code == 403
    assert resp.json()["detail"]["code"] == "administratorRoleRequired"


@pytest.mark.asyncio
async def test_session_returns_roles_and_workspaces(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    resp = await api_client.get("/v1/auth/session", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "admin" in body["roles"]
    assert "administration" in body["permittedWorkspaces"]
    assert "password" not in body
    assert "passwordHash" not in body


@pytest.mark.asyncio
async def test_register_worker_idempotent_and_worker_only(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    email = f"worker-{uuid.uuid4().hex[:10]}@development.invalid"
    key = f"idem-{uuid.uuid4().hex}"
    payload = {
        "displayName": "Registered Worker",
        "email": email,
        "facilityId": "fac-dev-001",
        "temporaryPassword": "TempWorker12Ab",
        "idempotencyKey": key,
        "role": "admin",
        "organisationId": "org-other",
        **PROFILE_FIELDS,
    }
    first = await api_client.post("/v1/admin/accounts", headers=headers, json=payload)
    assert first.status_code == 200, first.text
    body = first.json()
    assert body["roles"] == ["worker"]
    assert body["accountStatus"] == "pendingFirstLogin"
    assert body["firstLoginRequired"] is True
    assert body["professionalProfile"]["profession"] == "communityHealthOfficer"
    assert "temporaryPassword" not in body
    assert "password" not in body

    second = await api_client.post("/v1/admin/accounts", headers=headers, json=payload)
    assert second.status_code == 200
    assert second.json()["accountId"] == body["accountId"]

    changed = dict(payload)
    changed["displayName"] = "Different Name"
    conflict = await api_client.post("/v1/admin/accounts", headers=headers, json=changed)
    assert conflict.status_code == 409


@pytest.mark.asyncio
async def test_account_list_search_and_details(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    listed = await api_client.get("/v1/admin/accounts", headers=headers)
    assert listed.status_code == 200
    data = listed.json()
    assert data["total"] >= 1
    assert all("worker" in item["roles"] for item in data["items"])

    search = await api_client.get(
        "/v1/admin/accounts",
        headers=headers,
        params={"search": "synthetic worker"},
    )
    assert search.status_code == 200
    assert search.json()["total"] >= 1

    account_id = data["items"][0]["accountId"]
    details = await api_client.get(f"/v1/admin/accounts/{account_id}", headers=headers)
    assert details.status_code == 200
    assert "password" not in details.json()


@pytest.mark.asyncio
async def test_facility_deactivate_reactivate_and_reset(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    email = f"lifecycle-{uuid.uuid4().hex[:10]}@development.invalid"
    created = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Lifecycle Worker",
            "email": email,
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **PROFILE_FIELDS,
        },
    )
    assert created.status_code == 200, created.text
    account_id = created.json()["accountId"]
    version = created.json()["accountVersion"]

    facility = await api_client.patch(
        f"/v1/admin/accounts/{account_id}/facility",
        headers=headers,
        json={"facilityId": "fac-dev-hq", "expectedAccountVersion": version},
    )
    assert facility.status_code == 200, facility.text
    version = facility.json()["accountVersion"]

    # Complete first login so deactivate transition is valid from pendingFirstLogin/active.
    worker_headers = await auth_headers(api_client, account_id, "TempWorker12Ab")
    changed = await api_client.post(
        "/v1/auth/change-password",
        headers=worker_headers,
        json={"currentPassword": "TempWorker12Ab", "newPassword": "ChangedPass12A"},
    )
    assert changed.status_code == 200, changed.text

    details = await api_client.get(f"/v1/admin/accounts/{account_id}", headers=headers)
    version = details.json()["accountVersion"]

    deactivated = await api_client.post(
        f"/v1/admin/accounts/{account_id}/deactivate",
        headers=headers,
        json={"expectedAccountVersion": version},
    )
    assert deactivated.status_code == 200, deactivated.text
    version = deactivated.json()["accountVersion"]

    denied = await api_client.post(
        "/v1/development/auth/token",
        json={"account_id": account_id, "password": "ChangedPass12A"},
    )
    assert denied.status_code == 401

    reactivated = await api_client.post(
        f"/v1/admin/accounts/{account_id}/reactivate",
        headers=headers,
        json={"expectedAccountVersion": version},
    )
    assert reactivated.status_code == 200
    version = reactivated.json()["accountVersion"]

    reset = await api_client.post(
        f"/v1/admin/accounts/{account_id}/reset-access",
        headers=headers,
        json={
            "expectedAccountVersion": version,
            "temporaryPassword": "ResetTemp12Ab",
        },
    )
    assert reset.status_code == 200
    assert reset.json()["accountStatus"] == "pendingFirstLogin"


@pytest.mark.asyncio
async def test_cannot_deactivate_admin_bearing_account(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    await api_client.get("/v1/admin/accounts/dev-admin-001", headers=headers)
    # Admin-only account may 404 from worker-focused get if not worker — fetch via session.
    # Seed admin has no worker role; protect via direct deactivate attempt if visible.
    version = 1
    resp = await api_client.post(
        "/v1/admin/accounts/dev-admin-001/deactivate",
        headers=headers,
        json={"expectedAccountVersion": version},
    )
    assert resp.status_code in (403, 404, 409)


@pytest.mark.asyncio
async def test_device_revoke_and_history(api_client: AsyncClient) -> None:
    worker_headers = await auth_headers(api_client)
    device_id = await register_device(api_client, worker_headers)
    admin = await _admin_headers(api_client)

    devices = await api_client.get(
        "/v1/admin/accounts/dev-worker-001/devices",
        headers=admin,
    )
    assert devices.status_code == 200
    assert any(item["deviceId"] == device_id for item in devices.json()["items"])

    revoked = await api_client.post(
        f"/v1/admin/accounts/dev-worker-001/devices/{device_id}/revoke",
        headers=admin,
    )
    assert revoked.status_code == 200
    assert revoked.json()["status"] == "revoked"

    history = await api_client.get(
        "/v1/admin/accounts/dev-worker-001/history",
        headers=admin,
    )
    assert history.status_code == 200
    assert any(item["eventType"] == "deviceRevoked" for item in history.json()["items"])


@pytest.mark.asyncio
async def test_version_conflict_on_stale_mutation(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    email = f"stale-{uuid.uuid4().hex[:10]}@development.invalid"
    created = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Stale Worker",
            "email": email,
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **PROFILE_FIELDS,
        },
    )
    assert created.status_code == 200
    account_id = created.json()["accountId"]
    stale = await api_client.patch(
        f"/v1/admin/accounts/{account_id}/facility",
        headers=headers,
        json={"facilityId": "fac-dev-hq", "expectedAccountVersion": 999},
    )
    assert stale.status_code == 409
    assert stale.json()["detail"]["code"] == "accountVersionConflict"
