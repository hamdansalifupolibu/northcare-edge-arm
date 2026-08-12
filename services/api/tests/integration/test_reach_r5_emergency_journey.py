"""R5 emergency journey: create → list/detail → ack → escalate → public status."""

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


FORBIDDEN_PUBLIC_KEYS = {
    "contactNumber",
    "communityOrLandmark",
    "category",
    "requestType",
    "assignedWorkerId",
    "facilityId",
    "organisationId",
    "statusPin",
    "ambulanceStatus",
}


@pytest.mark.asyncio
async def test_r5_emergency_ack_escalate_public_status_journey(
    api_client: AsyncClient,
) -> None:
    """R2 transitions: acknowledged → escalated (contact may follow escalate)."""
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
            category="emergency",
            requestType="emergencyAssistance",
            contactNumber="+233200000112",
            communityOrLandmark="Synthetic R5 Emergency Landmark",
        ),
    )
    assert created.status_code == 200
    body = created.json()
    reference = body["referenceCode"]
    status_pin = body["statusPin"]
    assert "contactNumber" not in body
    assert "ambulance" not in str(body).lower()

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
        version = row.version
        assert row.category == "emergency"

    headers = await worker_headers(api_client)

    emergency_list = await api_client.get(
        "/v1/worker/community-requests",
        headers=headers,
        params={"filter": "emergency"},
    )
    assert emergency_list.status_code == 200
    items = emergency_list.json()["items"]
    match = next((item for item in items if item["requestId"] == request_id), None)
    assert match is not None
    assert "contactNumber" not in match
    assert match["category"] == "emergency"

    detail = await api_client.get(
        f"/v1/worker/community-requests/{request_id}",
        headers=headers,
    )
    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["contactNumber"]
    assert "statusPin" not in detail_body
    assert "ambulance" not in str(detail_body).lower()

    # Contact attempt before escalate must not unlock escalate path incorrectly —
    # R2 allows contact from acknowledged OR escalate from acknowledged.
    # Demo path: acknowledge → escalate → contact → public escalated status.
    ack = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/acknowledge",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert ack.status_code == 200
    version = ack.json()["version"]
    assert ack.json()["status"] == "acknowledged"

    escalate = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert escalate.status_code == 200
    escalate_body = escalate.json()
    assert escalate_body["status"] == "escalated"
    version = escalate_body["version"]
    message = (escalate_body.get("message") or "").lower()
    assert "support" in message
    assert "ambulance" not in message

    public_escalated = await api_client.post(
        "/v1/reach/requests/status",
        json={"referenceCode": reference, "statusPin": status_pin},
    )
    assert public_escalated.status_code == 200
    public_body = public_escalated.json()
    assert set(public_body.keys()) == {"publicStatusLabel"}
    assert public_body["publicStatusLabel"] == "Escalated for further support"
    for key in FORBIDDEN_PUBLIC_KEYS:
        assert key not in public_body
    assert "ambulance" not in public_body["publicStatusLabel"].lower()
    assert "landmark" not in public_body["publicStatusLabel"].lower()

    contact = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/contact-attempt",
        headers=headers,
        json={"expectedVersion": version},
    )
    assert contact.status_code == 200
    assert contact.json()["status"] == "contactAttempted"

    # Reach mutations must not create clinical artefacts on the community request.
    async with SessionLocal() as session:
        row = await session.get(CommunityRequest, request_id)
        assert row is not None
        assert row.status == "contactAttempted"
        assert not hasattr(row, "visit_id")
        assert not hasattr(row, "referral_id")
        assert not hasattr(row, "risk_level")


@pytest.mark.asyncio
async def test_r5_escalate_denials_and_no_auto_escalation(api_client: AsyncClient) -> None:
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
        # Fresh create must not auto-escalate.
        assert row.status in {"received", "assigned"}
        assert row.status != "escalated"
        row.assigned_worker_id = "dev-worker-001"
        row.status = "acknowledged"
        await session.commit()
        request_id = row.id
        version = row.version

    owner = await worker_headers(api_client, "dev-worker-001")
    other = await auth_headers(api_client, "dev-worker-temp", "TempPass1!")

    other_denied = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=other,
        json={"expectedVersion": version},
    )
    assert other_denied.status_code in (403, 404)

    admin = await auth_headers(api_client, "dev-admin-001", "AdminDemo1!")
    admin_denied = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=admin,
        json={"expectedVersion": version},
    )
    assert admin_denied.status_code in (401, 403)

    # Emergency-disabled owner cannot escalate emergency category.
    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=False,
        )

    capability_denied = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=owner,
        json={"expectedVersion": version},
    )
    assert capability_denied.status_code == 403

    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=True,
        )
        row = await session.get(CommunityRequest, request_id)
        assert row is not None
        row.status = "handled"
        await session.commit()
        version = row.version

    terminal_denied = await api_client.post(
        f"/v1/worker/community-requests/{request_id}/escalate",
        headers=owner,
        json={"expectedVersion": version},
    )
    assert terminal_denied.status_code in (400, 409, 422)
