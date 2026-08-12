from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from northcare_api.database import SessionLocal
from northcare_api.domain.enums import AccountRole, AccountStatus, RoleAssignmentStatus
from northcare_api.domain.models import CommunityRequest, ServerAccount, ServerAccountRole
from northcare_api.reach.routing import RoutingCandidate, select_assignee
from tests.helpers_reach import (
    create_payload,
    disable_reach_demo,
    enable_reach_demo,
    upsert_profile,
)


@pytest.fixture(autouse=True)
def _reach_gate() -> None:
    enable_reach_demo()
    yield
    disable_reach_demo()


def test_routing_matrix_unit_preferences() -> None:
    candidates = [
        RoutingCandidate("b-chn", "communityHealthNurse", True, False),
        RoutingCandidate("a-midwife", "midwife", True, False),
        RoutingCandidate("c-cho", "communityHealthOfficer", True, False),
    ]
    result = select_assignee(category="pregnancyNewborn", candidates=candidates)
    assert result.assigned_worker_id == "a-midwife"
    assert result.status == "assigned"

    no_midwife = [c for c in candidates if c.profession != "midwife"]
    fallback = select_assignee(category="pregnancyNewborn", candidates=no_midwife)
    assert fallback.assigned_worker_id == "c-cho"

    nutrition = select_assignee(
        category="nutrition",
        candidates=[
            RoutingCandidate("cho", "communityHealthOfficer", True, False),
            RoutingCandidate("nut", "nutritionOfficer", True, False),
        ],
    )
    assert nutrition.assigned_worker_id == "nut"

    emergency_excluded = select_assignee(
        category="emergency",
        candidates=[RoutingCandidate("cho", "communityHealthOfficer", True, False)],
    )
    assert emergency_excluded.assigned_worker_id is None
    emergency_ok = select_assignee(
        category="emergency",
        candidates=[RoutingCandidate("cho", "communityHealthOfficer", True, True)],
    )
    assert emergency_ok.assigned_worker_id == "cho"


@pytest.mark.asyncio
async def test_routing_assigns_development_worker_and_dual_role(
    api_client: AsyncClient,
) -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session, "dev-worker-001", profession="communityHealthOfficer", emergency=True
        )
        # Ensure dual-role demo account exists or skip if absent in synthetic seed.
        dual = await session.get(ServerAccount, "dev-dual-8d2ce4bbb8e656c8afea")
        if dual is not None:
            await upsert_profile(
                session,
                dual.id,
                profession="communityHealthOfficer",
                community=True,
                emergency=True,
            )

    # Midwife preferred for pregnancy — create midwife with lower account id rank.
    midwife_id = "aaa-midwife-001"
    async with SessionLocal() as session:
        if await session.get(ServerAccount, midwife_id) is None:
            session.add(
                ServerAccount(
                    id=midwife_id,
                    remote_subject=midwife_id,
                    display_name="Synthetic Midwife",
                    role=AccountRole.WORKER,
                    organisation_id="org-dev-001",
                    facility_id="fac-dev-001",
                    is_active=True,
                    account_status=AccountStatus.ACTIVE,
                    normalised_email=f"{midwife_id}@development.invalid",
                    identity_provider="development",
                )
            )
            session.add(
                ServerAccountRole(
                    id=f"role-{uuid.uuid4().hex[:12]}",
                    account_id=midwife_id,
                    role=AccountRole.WORKER,
                    status=RoleAssignmentStatus.ACTIVE,
                )
            )
            await session.commit()
        await upsert_profile(session, midwife_id, profession="midwife")

    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="pregnancyNewborn", requestType="routine"),
    )
    assert created.status_code == 200
    reference = created.json()["referenceCode"]
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        assert row.status == "assigned"
        assert row.assigned_worker_id == midwife_id


@pytest.mark.asyncio
async def test_no_match_remains_received_unassigned(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        # Disable community requests on default worker so nutrition has no match
        # unless a nutrition officer exists.
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="physicianAssistant",
            community=True,
            emergency=False,
        )
        accounts = (
            await session.execute(
                select(ServerAccount).where(
                    ServerAccount.facility_id == "fac-dev-001",
                    ServerAccount.is_active.is_(True),
                )
            )
        ).scalars().all()
        for account in accounts:
            await upsert_profile(
                session,
                account.id,
                profession="physicianAssistant",
                community=True,
                emergency=False,
            )

    created = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(category="nutrition", requestType="routine"),
    )
    assert created.status_code == 200
    reference = created.json()["referenceCode"]
    async with SessionLocal() as session:
        row = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference)
            )
        ).scalar_one()
        assert row.assigned_worker_id is None
        assert row.status == "received"


@pytest.mark.asyncio
async def test_excludes_inactive_admin_only_wrong_scope(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session, "dev-admin-001", profession="communityHealthOfficer", emergency=True
        )
        inactive = await session.get(ServerAccount, "dev-worker-inactive")
        if inactive is not None:
            await upsert_profile(
                session, inactive.id, profession="communityHealthOfficer", emergency=True
            )
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="registeredGeneralNurse",
            community=False,
            emergency=False,
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
        # Admin-only and inactive / community-disabled must not be assigned.
        assert row.assigned_worker_id not in {"dev-admin-001", "dev-worker-inactive"}
        if row.assigned_worker_id == "dev-worker-001":
            pytest.fail("community-disabled worker should not be assigned")


@pytest.mark.asyncio
async def test_emergency_requires_emergency_flag(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
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
        assert row.assigned_worker_id is None
        assert row.status == "received"

    async with SessionLocal() as session:
        await upsert_profile(
            session,
            "dev-worker-001",
            profession="communityHealthOfficer",
            community=True,
            emergency=True,
        )
    created2 = await api_client.post(
        "/v1/reach/requests",
        json=create_payload(
            category="emergency",
            requestType="emergencyAssistance",
            contactNumber="+233200000099",
            communityOrLandmark=f"Landmark {datetime.now(UTC).timestamp()}",
        ),
    )
    assert created2.status_code == 200
    reference2 = created2.json()["referenceCode"]
    async with SessionLocal() as session:
        row2 = (
            await session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference2)
            )
        ).scalar_one()
        assert row2.assigned_worker_id == "dev-worker-001"
        assert row2.status == "assigned"
