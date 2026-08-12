from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from northcare_api.database import SessionLocal
from northcare_api.domain.models import AdministrationAuditEvent, CommunityRequest
from northcare_api.reach.errors import REACH_INVALID_TRANSITION, ReachError
from northcare_api.reach.transitions import apply_transition, can_transition
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


def test_transition_engine_rejects_invalid() -> None:
    assert can_transition("assigned", "acknowledged")
    assert not can_transition("handled", "acknowledged")
    assert not can_transition("cancelled", "assigned")
    assert not can_transition("escalated", "assigned")
    with pytest.raises(ReachError) as exc_info:
        apply_transition("handled", "contactAttempted")
    assert exc_info.value.code == REACH_INVALID_TRANSITION.code


async def _create_assigned(api_client: AsyncClient) -> tuple[str, int]:
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
        json=create_payload(category="generalChps", requestType="routine"),
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
        return row.id, row.version


@pytest.mark.asyncio
async def test_full_lifecycle_and_versioning(api_client: AsyncClient) -> None:
    request_id, version = await _create_assigned(api_client)
    headers = await worker_headers(api_client)

    ack = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert ack.status_code == 200
    assert ack.json()["status"] == "acknowledged"
    version = ack.json()["version"]

    contact = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/contact-attempt",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert contact.status_code == 200
    version = contact.json()["version"]

    handled = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/handle",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert handled.status_code == 200
    assert handled.json()["status"] == "handled"
    assert "clinical" in (handled.json().get("message") or "").lower()
    handled_version = handled.json()["version"]

    terminal = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/handle",
        headers=headers,
        json={"expectedVersion": handled_version},
    )
    assert terminal.status_code == 400

    stale = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/contact-attempt",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert stale.status_code == 409

    async with SessionLocal() as session:
        events = (
            await session.execute(
                select(AdministrationAuditEvent).where(
                    AdministrationAuditEvent.event_type.in_(
                        [
                            "community_request_acknowledged",
                            "community_request_contact_attempted",
                            "community_request_handled",
                        ]
                    )
                )
            )
        ).scalars().all()
        assert events
        for event in events:
            meta = str(event.safe_metadata)
            assert "statusPin" not in meta
            assert "contactNumber" not in meta


@pytest.mark.asyncio
async def test_claim_unassigned_and_concurrent_ack(api_client: AsyncClient) -> None:
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
        json=create_payload(category="nutrition", requestType="routine"),
    )
    # Force unassigned for claim test.
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
        # Make nutrition eligible for CHO/CHN — category nutrition prefers nutritionOfficer
        # then CHO/CHN. Ensure category is generalChps for CHO eligibility instead.
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
    assert first.status_code == 200
    assert first.json()["status"] == "acknowledged"
    assert first.json()["assignedWorkerId"] == "dev-worker-001"

    second = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers_b,
        json={"expectedVersion": version},
    )
    assert second.status_code in {403, 409}


@pytest.mark.asyncio
async def test_escalate_requires_capability_and_stale_version(
    api_client: AsyncClient,
) -> None:
    request_id, version = await _create_assigned(api_client)
    headers = await worker_headers(api_client)
    ack = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers,
        json={"expectedVersion": version},
    )
    version = ack.json()["version"]

    # Mark as emergency after acknowledge to exercise capability check.
    async with SessionLocal() as session:
        row = await session.get(CommunityRequest, request_id)
        assert row is not None
        row.category = "emergency"
        await session.commit()
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=False,
        )

    denied = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert denied.status_code == 403

    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=True,
        )

    stale = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=headers,
        json={"expectedVersion": 1},
    )
    assert stale.status_code == 409

    ok = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "escalated"
    assert "support" in (ok.json().get("message") or "").lower()
