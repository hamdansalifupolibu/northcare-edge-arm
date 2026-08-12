"""Shared helpers for NorthCare Reach R2 tests."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.config import get_settings
from northcare_api.domain.models import WorkerProfessionalProfile
from tests.helpers import auth_headers


def enable_reach_demo() -> None:
    import os

    os.environ["NORTHCARE_REACH_DEMO_ENABLED"] = "true"
    os.environ["NORTHCARE_ENV"] = "test"
    get_settings.cache_clear()


def disable_reach_demo() -> None:
    import os

    os.environ["NORTHCARE_REACH_DEMO_ENABLED"] = "false"
    get_settings.cache_clear()


def create_payload(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "channel": "ussdSimulator",
        "category": "generalChps",
        "requestType": "routine",
        "contactNumber": "+233200000001",
        "communityOrLandmark": "Synthetic Landmark A",
        "preferredLanguage": "en",
        "consentToContact": True,
        "consentToShareLocation": True,
    }
    body.update(overrides)
    return body


async def upsert_profile(
    session: AsyncSession,
    account_id: str,
    *,
    profession: str,
    community: bool = True,
    emergency: bool = False,
) -> None:
    existing = await session.get(WorkerProfessionalProfile, account_id)
    now = datetime.now(UTC)
    if existing is None:
        session.add(
            WorkerProfessionalProfile(
                account_id=account_id,
                profession=profession,
                other_profession_description=None,
                community_requests_enabled=community,
                emergency_requests_enabled=emergency,
                version=1,
                created_at=now,
                updated_at=now,
            )
        )
    else:
        existing.profession = profession
        existing.other_profession_description = None
        existing.community_requests_enabled = community
        existing.emergency_requests_enabled = emergency
        existing.version += 1
        existing.updated_at = now
    await session.commit()


async def worker_headers(client: AsyncClient, account_id: str = "dev-worker-001") -> dict[str, str]:
    return await auth_headers(client, account_id, "WorkerDemo1!")


async def admin_headers(client: AsyncClient) -> dict[str, str]:
    return await auth_headers(client, "dev-admin-001", "AdminDemo1!")
