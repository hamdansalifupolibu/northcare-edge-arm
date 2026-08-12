"""Reach R6 packaged E2E journeys: routine, emergency, admin, privacy, concurrency, env gate."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from northcare_api.config import Settings
from northcare_api.database import SessionLocal
from northcare_api.domain.models import CommunityRequest
from tests.helpers import auth_headers
from tests.helpers_reach import (
    create_payload,
    disable_reach_demo,
    enable_reach_demo,
    upsert_profile,
    worker_headers,
)

FORBIDDEN_PUBLIC_KEYS = {
    "category",
    "requestType",
    "contactNumber",
    "communityOrLandmark",
    "preferredLanguage",
    "assignedWorkerId",
    "facilityId",
    "organisationId",
    "requestId",
    "id",
    "statusPin",
    "statusPinHash",
    "failedStatusLookupCount",
    "statusLookupLockedUntil",
    "audit",
    "ambulanceStatus",
}

FORBIDDEN_DETAIL_KEYS = {
    "statusPin",
    "statusPinHash",
    "failedStatusLookupCount",
    "statusLookupLockedUntil",
    "pinVerifier",
}


@pytest.fixture(autouse=True)
def _reach_gate() -> None:
    enable_reach_demo()
    yield
    disable_reach_demo()


async def _ensure_cho(session_account: str = "dev-worker-001") -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session,
            session_account,
            profession="communityHealthOfficer",
            community=True,
            emergency=True,
        )


async def _force_assign(reference: str, worker_id: str = "dev-worker-001") -> tuple[str, int]:
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        row.assigned_worker_id = worker_id
        row.status = "assigned"
        await session.commit()
        return row.id, row.version


@pytest.mark.asyncio
async def test_r6_routine_end_to_end_journey(api_client: AsyncClient) -> None:
    await _ensure_cho()
    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(
            category="childHealth",
            requestType="routine",
            contactNumber="+233200000901",
            communityOrLandmark="Synthetic R6 Routine Landmark",
        ),
    )
    assert created.status_code == 200
    body = created.json()
    reference = body["referenceCode"]
    status_pin = body["statusPin"]
    assert "contactNumber" not in body
    assert "facilityId" not in body
    assert "assignedWorkerId" not in body

    request_id, version = await _force_assign(reference)
    headers = await worker_headers(api_client)

    listed = await api_client.get("/v1/worker/community-requests", headers=headers)
    assert listed.status_code == 200
    match = next(item for item in listed.json()["items"] if item["requestId"] == request_id)
    assert "contactNumber" not in match

    detail = await api_client.get(
        f"/v1/worker/community-requests/{request_id}",
        headers=headers,
    )
    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["contactNumber"] == "+233200000901"
    for key in FORBIDDEN_DETAIL_KEYS:
        assert key not in detail_body

    ack = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert ack.status_code == 200
    version = ack.json()["version"]

    public_ack = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public_ack.status_code == 200
    assert set(public_ack.json().keys()) == {"publicStatusLabel"}
    assert public_ack.json()["publicStatusLabel"] == "Health worker acknowledged"
    for key in FORBIDDEN_PUBLIC_KEYS:
        assert key not in public_ack.json()

    contact = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/contact-attempt",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert contact.status_code == 200
    version = contact.json()["version"]

    public_contact = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public_contact.status_code == 200
    assert set(public_contact.json().keys()) == {"publicStatusLabel"}

    handled = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/handle",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert handled.status_code == 200
    assert handled.json()["status"] == "handled"
    assert "clinical" in (handled.json().get("message") or "").lower()

    public_handled = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public_handled.status_code == 200
    label = public_handled.json()["publicStatusLabel"].lower()
    assert "handled" in label
    assert "ambulance" not in label
    assert set(public_handled.json().keys()) == {"publicStatusLabel"}


@pytest.mark.asyncio
async def test_r6_emergency_end_to_end_journey(api_client: AsyncClient) -> None:
    await _ensure_cho()
    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(
            category="emergency",
            requestType="emergencyAssistance",
            contactNumber="+233200000912",
            communityOrLandmark="Synthetic R6 Emergency Landmark",
        ),
    )
    assert created.status_code == 200
    body = created.json()
    assert body.get("simulationNotice")
    assert "112" in (body.get("emergencyReminder") or "")
    assert "ambulance" not in str(body).lower()
    reference = body["referenceCode"]
    status_pin = body["statusPin"]

    request_id, version = await _force_assign(reference)
    headers = await worker_headers(api_client)

    emergency_list = await api_client.get(
        "/v1/worker/community-requests",
        headers=headers,
        params={"filter": "emergency"},
    )
    assert emergency_list.status_code == 200
    assert any(item["requestId"] == request_id for item in emergency_list.json()["items"])

    ack = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert ack.status_code == 200
    version = ack.json()["version"]

    # R2 freeze: escalate is allowed from acknowledged (contact is optional and may follow).
    escalate = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert escalate.status_code == 200
    assert escalate.json()["status"] == "escalated"
    assert "ambulance" not in str(escalate.json()).lower()

    public = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public.status_code == 200
    label = public.json()["publicStatusLabel"]
    assert label == "Escalated for further support"
    assert "ambulance" not in label.lower()
    assert set(public.json().keys()) == {"publicStatusLabel"}


@pytest.mark.asyncio
async def test_r6_administration_profession_journey(api_client: AsyncClient) -> None:
    admin = await auth_headers(api_client, "dev-admin-001", "AdminDemo1!")
    email = f"r6-worker-{uuid.uuid4().hex[:10]}@development.invalid"
    created = await api_client.post(
        "/v1/admin/accounts",
        headers=admin,
        json={
            "displayName": "R6 Synth Worker",
            "email": email,
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-r6-{uuid.uuid4().hex}",
            "profession": "communityHealthNurse",
            "communityRequestsEnabled": True,
            "emergencyRequestsEnabled": False,
        },
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["roles"] == ["worker"] or "worker" in body.get("roles", [])
    assert "admin" not in body.get("roles", [])
    profile = body["professionalProfile"]
    assert profile["profession"] == "communityHealthNurse"
    assert profile["communityRequestsEnabled"] is True
    assert profile["emergencyRequestsEnabled"] is False

    details = await api_client.get(f"/v1/admin/accounts/{body['accountId']}", headers=admin)
    assert details.status_code == 200
    assert details.json()["professionalProfile"]["profession"] == "communityHealthNurse"

    # Admin-only account cannot use worker Reach list.
    admin_only = await auth_headers(api_client, "dev-admin-001", "AdminDemo1!")
    denied = await api_client.get("/v1/worker/community-requests", headers=admin_only)
    assert denied.status_code in {401, 403}


@pytest.mark.asyncio
async def test_r6_public_status_privacy_and_worker_omissions(api_client: AsyncClient) -> None:
    await _ensure_cho()
    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(
            category="nutrition",
            requestType="routine",
            communityOrLandmark="Synthetic R6 Privacy Landmark",
        ),
    )
    assert created.status_code == 200
    reference = created.json()["referenceCode"]
    status_pin = created.json()["statusPin"]
    request_id, version = await _force_assign(reference)
    headers = await worker_headers(api_client)

    public = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public.status_code == 200
    assert set(public.json().keys()) == {"publicStatusLabel"}

    listed = await api_client.get("/v1/worker/community-requests", headers=headers)
    item = next(i for i in listed.json()["items"] if i["requestId"] == request_id)
    assert "contactNumber" not in item

    detail = await api_client.get(
        f"/v1/worker/community-requests/{request_id}",
        headers=headers,
    )
    assert detail.status_code == 200
    for key in FORBIDDEN_DETAIL_KEYS:
        assert key not in detail.json()

    # Touch version path so unused variable is intentional for future mutation.
    assert version >= 1


@pytest.mark.asyncio
async def test_r6_concurrency_acknowledge(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=True,
        )
        await upsert_profile(
            session,
            "dev-worker-temp",
            profession="communityHealthNurse",
            community=True,
            emergency=True,
        )

    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="generalChps", requestType="routine"),
    )
    assert created.status_code == 200
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(
                    CommunityRequest.reference_code == created.json()["referenceCode"]
                )
            )
        ).scalar_one()
        row.assigned_worker_id = None
        row.status = "received"
        row.category = "generalChps"
        await session.commit()
        request_id = row.id
        version = row.version

    headers_a = await worker_headers(api_client, "dev-worker-001")
    headers_b = await auth_headers(api_client, "dev-worker-temp", "TempPass1!")

    first = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers_a,
        json={"expectedVersion": version},
    )
    second = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers_b,
        json={"expectedVersion": version},
    )
    assert first.status_code == 200
    assert first.json()["assignedWorkerId"] == "dev-worker-001"
    assert second.status_code in {403, 409}

    async with SessionLocal() as session:
        row = await session.get(CommunityRequest, request_id)
        assert row is not None
        assert row.assigned_worker_id == "dev-worker-001"
        assert row.version == first.json()["version"]


def test_r6_environment_gate_defaults_and_refusal() -> None:
    disable_reach_demo()
    assert (
        Settings(NORTHCARE_ENV="development", NORTHCARE_REACH_DEMO_ENABLED=False).reach_demo_enabled
        is False
    )
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="staging", NORTHCARE_REACH_DEMO_ENABLED=True)
    with pytest.raises(ValueError):
        Settings(NORTHCARE_ENV="production", NORTHCARE_REACH_DEMO_ENABLED=True)
