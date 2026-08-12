from __future__ import annotations

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from northcare_api import config
from northcare_api.database import SessionLocal
from northcare_api.domain.models import CommunityRequest
from northcare_api.reach.errors import REACH_FACILITY_UNAVAILABLE, ReachError
from northcare_api.reach.service import ReachService
from northcare_api.reach.status_pin import hash_status_pin
from tests.helpers_reach import create_payload, disable_reach_demo, enable_reach_demo


@pytest.fixture(autouse=True)
def _reach_gate() -> None:
    enable_reach_demo()
    yield
    disable_reach_demo()


@pytest.mark.asyncio
async def test_facility_resolution_failure_rolls_back(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        before = (
            await session.execute(select(func.count()).select_from(CommunityRequest))
        ).scalar_one()
        service = ReachService(session, config.get_settings())
        with (
            patch.object(
                service,
                "_resolve_demo_facility",
                AsyncMock(side_effect=REACH_FACILITY_UNAVAILABLE),
            ),
            pytest.raises(ReachError),
        ):
            await service.create_public_request(create_payload())
        await session.rollback()
        after = (
            await session.execute(select(func.count()).select_from(CommunityRequest))
        ).scalar_one()
        assert after == before


@pytest.mark.asyncio
async def test_reference_collision_retries(api_client: AsyncClient) -> None:
    collision_ref = f"NCR-COL{uuid.uuid4().hex[:5].upper()}"
    seed_id = f"cr-seed-{uuid.uuid4().hex[:12]}"
    calls = {"n": 0}
    from northcare_api.reach.reference import generate_reference_code as real_generate

    def flaky() -> str:
        calls["n"] += 1
        if calls["n"] == 1:
            return collision_ref
        return real_generate()

    async with SessionLocal() as session:
        session.add(
            CommunityRequest(
                id=seed_id,
                reference_code=collision_ref,
                status_pin_hash=hash_status_pin("123456"),
                channel="ussdSimulator",
                category="generalChps",
                request_type="routine",
                contact_number="+233200000010",
                community_or_landmark="Seed",
                preferred_language="en",
                consent_to_contact=True,
                consent_to_share_location=True,
                organisation_id="org-dev-001",
                facility_id="fac-dev-001",
                assigned_worker_id=None,
                status="received",
                version=1,
                failed_status_lookup_count=0,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
        )
        await session.commit()

        service = ReachService(session, config.get_settings())
        with patch("northcare_api.reach.service.generate_reference_code", flaky):
            result = await service.create_public_request(create_payload())
        assert result.reference_code != collision_ref
        assert calls["n"] >= 2


@pytest.mark.asyncio
async def test_audit_failure_prevents_success(api_client: AsyncClient) -> None:
    async with SessionLocal() as session:
        before = (
            await session.execute(select(func.count()).select_from(CommunityRequest))
        ).scalar_one()
        service = ReachService(session, config.get_settings())
        with (
            patch(
                "northcare_api.reach.service.write_audit",
                AsyncMock(side_effect=RuntimeError("audit boom")),
            ),
            pytest.raises(RuntimeError),
        ):
            await service.create_public_request(create_payload())
        await session.rollback()
        after = (
            await session.execute(select(func.count()).select_from(CommunityRequest))
        ).scalar_one()
        assert after == before
