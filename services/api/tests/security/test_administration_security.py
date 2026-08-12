from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from tests.helpers import auth_headers


@pytest.mark.asyncio
async def test_client_supplied_admin_role_ignored_on_registration(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client, "dev-admin-001", "AdminDemo1!")
    email = f"sec-{uuid.uuid4().hex[:10]}@development.invalid"
    resp = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Security Worker",
            "email": email,
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            "role": "admin",
            "organisationId": "org-forged",
            "profession": "communityHealthOfficer",
            "communityRequestsEnabled": True,
            "emergencyRequestsEnabled": False,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["roles"] == ["worker"]
    assert "password" not in body
    assert "temporaryPassword" not in body
    details = await api_client.get(f"/v1/admin/accounts/{body['accountId']}", headers=headers)
    assert details.status_code == 200
    assert details.json()["organisationId"] == "org-dev-001"


def test_production_settings_disable_development_auth() -> None:
    from northcare_api.config import Settings

    assert Settings(NORTHCARE_ENV="production").development_auth_enabled is False
    assert Settings(NORTHCARE_ENV="staging").development_auth_enabled is False
