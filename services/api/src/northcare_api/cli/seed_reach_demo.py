"""Development-only seed for a small synthetic NorthCare Reach demonstration set.

Creates repeatable demo community requests through the same public create path used by
the USSD simulator. Never stores raw status PINs in source. Does not print PINs unless
`--show-pins` is explicitly supplied.

Prefer: reset → seed → walkthrough, or create live requests in the simulator.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select

from northcare_api.cli.demo_env import confirm_or_yes, refuse_non_development
from northcare_api.cli.reset_reach_demo import reset_demo
from northcare_api.config import get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.models import CommunityRequest
from northcare_api.reach.service import ReachService

_DEMO_MARKER = "SYNTH-DEMO-R6"


@dataclass(frozen=True)
class SeedScenario:
    key: str
    category: str
    request_type: str
    landmark_suffix: str
    contact_suffix: str
    post_status: str | None = None
    force_unassigned: bool = False


SCENARIOS: tuple[SeedScenario, ...] = (
    SeedScenario(
        key="child-health-routine",
        category="childHealth",
        request_type="routine",
        landmark_suffix="Child Health CHPS Landmark",
        contact_suffix="001",
    ),
    SeedScenario(
        key="pregnancy-newborn",
        category="pregnancyNewborn",
        request_type="routine",
        landmark_suffix="Pregnancy Newborn Landmark",
        contact_suffix="002",
    ),
    SeedScenario(
        key="nutrition",
        category="nutrition",
        request_type="routine",
        landmark_suffix="Nutrition Landmark",
        contact_suffix="003",
    ),
    SeedScenario(
        key="emergency-assistance",
        category="emergency",
        request_type="emergencyAssistance",
        landmark_suffix="Emergency Assistance Landmark",
        contact_suffix="112",
    ),
    SeedScenario(
        key="handled-general",
        category="generalChps",
        request_type="routine",
        landmark_suffix="Handled General CHPS Landmark",
        contact_suffix="004",
        post_status="handled",
    ),
    SeedScenario(
        key="unassigned-referral",
        category="referralFollowUp",
        request_type="routine",
        landmark_suffix="Unassigned Referral Landmark",
        contact_suffix="005",
        force_unassigned=True,
    ),
)


def _landmark(scenario: SeedScenario) -> str:
    return f"{_DEMO_MARKER}:{scenario.key}:{scenario.landmark_suffix}"


def _contact(scenario: SeedScenario) -> str:
    # Clearly synthetic Ghana-format placeholder; not a real subscriber.
    return f"+23320000{scenario.contact_suffix}"


async def _existing_demo_keys(session: Any) -> set[str]:
    settings = get_settings()
    rows = (
        await session.execute(
            select(CommunityRequest.community_or_landmark)
            .where(CommunityRequest.organisation_id == settings.reach_demo_organisation_id)
            .where(CommunityRequest.facility_id == settings.reach_demo_facility_id)
            .where(CommunityRequest.community_or_landmark.like(f"{_DEMO_MARKER}:%"))
        )
    ).scalars().all()
    keys: set[str] = set()
    for landmark in rows:
        parts = landmark.split(":")
        if len(parts) >= 2:
            keys.add(parts[1])
    return keys


async def seed_demo(*, yes: bool, reset_first: bool, show_pins: bool) -> int:
    settings = get_settings()
    refused = refuse_non_development(settings)
    if refused is not None:
        return refused

    if not settings.reach_demo_enabled:
        print(
            "Reach demo seed requires NORTHCARE_REACH_DEMO_ENABLED=true in development.",
            file=sys.stderr,
        )
        return 2

    if not confirm_or_yes(
        yes=yes,
        prompt="Seed synthetic Reach demonstration requests?",
    ):
        print("Aborted. No seed changes applied.", file=sys.stderr)
        return 1

    if reset_first:
        reset_code = await reset_demo(yes=True)
        if reset_code != 0:
            return reset_code
        get_settings.cache_clear()

    created = 0
    skipped = 0
    adjusted = 0
    pin_lines: list[str] = []

    async with SessionLocal() as session:
        existing = await _existing_demo_keys(session)
        service = ReachService(session, settings)

        for scenario in SCENARIOS:
            if scenario.key in existing:
                skipped += 1
                continue

            response = await service.create_public_request(
                {
                    "channel": "ussdSimulator",
                    "category": scenario.category,
                    "requestType": scenario.request_type,
                    "contactNumber": _contact(scenario),
                    "communityOrLandmark": _landmark(scenario),
                    "preferredLanguage": "en",
                    "consentToContact": True,
                    "consentToShareLocation": True,
                }
            )
            created += 1
            if show_pins:
                pin_lines.append(
                    f"referenceCode={response.reference_code} "
                    f"scenario={scenario.key} statusPin=(one-time; shown once)"
                )
                # Explicit operator request: show the one-time PIN in the operator console only.
                pin_lines.append(f"statusPin={response.status_pin}")

            row = (
                await session.execute(
                    select(CommunityRequest).where(
                        CommunityRequest.reference_code == response.reference_code
                    )
                )
            ).scalar_one()

            changed = False
            if scenario.force_unassigned:
                row.assigned_worker_id = None
                row.status = "received"
                changed = True
            if scenario.post_status == "handled":
                if row.assigned_worker_id is None:
                    # Leave unassigned handled requests out of scope; mark received→skip.
                    pass
                else:
                    row.status = "handled"
                    changed = True
            if changed:
                row.version += 1
                row.updated_at = datetime.now(UTC)
                await session.commit()
                adjusted += 1

    print("Reach demo seed complete.")
    print(f"organisationId={settings.reach_demo_organisation_id}")
    print(f"facilityId={settings.reach_demo_facility_id}")
    print(f"createdRequests={created}")
    print(f"skippedExisting={skipped}")
    print(f"adjustedStatuses={adjusted}")
    print(f"scenarioCount={len(SCENARIOS)}")
    print("note=Status PINs are one-time; use simulator or --show-pins for operator display.")
    if show_pins:
        print("ONE-TIME OPERATOR PIN DISPLAY (do not record in docs or screenshots):")
        for line in pin_lines:
            print(line)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Seed synthetic NorthCare Reach demonstration requests (development only)."
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip interactive confirmation.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Run reset_reach_demo before seeding.",
    )
    parser.add_argument(
        "--show-pins",
        action="store_true",
        help="Print one-time status PINs to the operator console (never commit this output).",
    )
    args = parser.parse_args(argv)
    return asyncio.run(
        seed_demo(yes=args.yes, reset_first=args.reset, show_pins=args.show_pins)
    )


if __name__ == "__main__":
    raise SystemExit(main())
