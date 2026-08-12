"""R4 API journey: public create → worker list/detail/actions → public status privacy."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select

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


@pytest.fixture(autouse=True)
def _reach_gate() -> None:
    enable_reach_demo()
    yield
    disable_reach_demo()


@pytest.mark.asyncio
async def test_r4_simulator_to_worker_to_public_status_journey(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=True,
        )

    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(
            category="generalChps",
            requestType="routine",
            contactNumber="+233200000099",
            communityOrLandmark="Synthetic R4 Landmark",
        ),
    )
    assert created.status_code == 200
    body = created.json()
    reference = body["referenceCode"]
    status_pin = body["statusPin"]
    assert "contactNumber" not in body
    assert status_pin

    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        # Ensure the demonstration worker can see and act on the request regardless of
        # which eligible account deterministic routing selected first.
        row.assigned_worker_id = "dev-worker-001"
        row.status = "assigned"
        await session.commit()
        request_id = row.id
        version = row.version

    headers = await worker_headers(api_client)

    listed = await api_client.get(
        "/v1/worker/community-requests",
        headers=headers,
        params={"filter": "awaiting"},
    )
    assert listed.status_code == 200
    items = listed.json()["items"]
    match = next((item for item in items if item["requestId"] == request_id), None)
    assert match is not None
    assert "contactNumber" not in match

    detail = await api_client.get(
        f"/v1/worker/community-requests/{request_id}",
        headers=headers,
    )
    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["contactNumber"]
    assert "statusPin" not in detail_body
    assert "statusPinVerifier" not in detail_body

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
    assert public_ack.json()["publicStatusLabel"]
    assert set(public_ack.json().keys()) == {"publicStatusLabel"}

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
    assert "contact" in public_contact.json()["publicStatusLabel"].lower()

    handled = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/handle",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert handled.status_code == 200
    assert handled.json()["status"] == "handled"

    public_handled = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public_handled.status_code == 200
    assert "handled" in public_handled.json()["publicStatusLabel"].lower()

    admin = await auth_headers(api_client, "dev-admin-001", "AdminDemo1!")
    admin_list = await api_client.get(
        "/v1/worker/community-requests",
        headers=admin,
        params={"filter": "awaiting"},
    )
    assert admin_list.status_code in (401, 403)


@pytest.mark.asyncio
async def test_r4_list_filters_and_wrong_worker_denied(api_client: AsyncClient) -> None:
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
            emergency=False,
        )

    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="emergency", requestType="emergencyAssistance"),
    )
    assert created.status_code == 200
    reference = created.json()["referenceCode"]

    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        row.assigned_worker_id = "dev-worker-001"
        row.status = "assigned"
        await session.commit()
        request_id = row.id

    owner = await worker_headers(api_client, "dev-worker-001")
    emergency = await api_client.get(
        "/v1/worker/community-requests",
        headers=owner,
        params={"filter": "emergency"},
    )
    assert emergency.status_code == 200
    assert any(item["requestId"] == request_id for item in emergency.json()["items"])

    other = await auth_headers(api_client, "dev-worker-temp", "TempPass1!")
    denied = await api_client.get(
        f"/v1/worker/community-requests/{request_id}",
        headers=other,
    )
    assert denied.status_code in (403, 404)
