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


async def _seed_cho(emergency: bool = True) -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=emergency,
        )


@pytest.mark.asyncio
async def test_assigned_worker_can_view_and_list_hides_contact(
    api_client: AsyncClient,
) -> None:
    await _seed_cho()
    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="generalChps", requestType="routine"),
    )
    reference = created.json()["referenceCode"]
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        request_id = row.id
        # Force assignment to worker for stable authz assertions.
        row.assigned_worker_id = "dev-worker-001"
        row.status = "assigned"
        await session.commit()

    headers = await worker_headers(api_client)
    listed = await api_client.get(
        "/v1/worker/community-requests",
        headers=headers,
        params={"filter": "assignedToMe"},
    )
    assert listed.status_code == 200
    items = listed.json()["items"]
    assert any(item["requestId"] == request_id for item in items)
    assert all("contactNumber" not in item for item in items)

    detail = await api_client.get(
        f"/v1/worker/community-requests/{request_id}", headers=headers
    )
    assert detail.status_code == 200
    body = detail.json()
    assert "contactNumber" in body
    assert "statusPinHash" not in body
    assert "failedStatusLookupCount" not in body
    assert "statusLookupLockedUntil" not in body


@pytest.mark.asyncio
async def test_admin_only_and_unsigned_denied(api_client: AsyncClient) -> None:
    await _seed_cho()
    created = await api_client.post("/v1/reach/requests", json=create_payload())
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(
                    CommunityRequest.reference_code == created.json()["referenceCode"]
                )
            )
        ).scalar_one()
        request_id = row.id

    unsigned = await api_client.get(f"/v1/worker/community-requests/{request_id}")
    assert unsigned.status_code == 401

    admin = await auth_headers(api_client, "dev-admin-001", "AdminDemo1!")
    denied = await api_client.get(
        f"/v1/worker/community-requests/{request_id}", headers=admin
    )
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_emergency_disabled_worker_cannot_view_emergency(
    api_client: AsyncClient,
) -> None:
    await _seed_cho(emergency=False)
    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="emergency", requestType="emergencyAssistance"),
    )
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(
                    CommunityRequest.reference_code == created.json()["referenceCode"]
                )
            )
        ).scalar_one()
        request_id = row.id
        assert row.assigned_worker_id is None

    headers = await worker_headers(api_client)
    detail = await api_client.get(
        f"/v1/worker/community-requests/{request_id}", headers=headers
    )
    assert detail.status_code == 403
