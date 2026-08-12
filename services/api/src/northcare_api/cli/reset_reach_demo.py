"""Development-only reset for synthetic NorthCare Reach demonstration requests.

Deletes community_requests for the configured demo organisation/facility that were
created through the USSD simulator channel. Preserves accounts, roles, professional
profiles, clinical sync records, and unrelated audit events.

Does not print contact numbers, status PINs, or credentials.
Does not expose a public HTTP reset endpoint.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from sqlalchemy import delete, select

from northcare_api.cli.demo_env import confirm_or_yes, refuse_non_development
from northcare_api.config import get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.models import CommunityRequest

_DEMO_CHANNEL = "ussdSimulator"


async def reset_demo(*, yes: bool) -> int:
    settings = get_settings()
    refused = refuse_non_development(settings)
    if refused is not None:
        return refused

    org_id = settings.reach_demo_organisation_id
    facility_id = settings.reach_demo_facility_id

    async with SessionLocal() as session:
        rows = (
            await session.execute(
                select(CommunityRequest.id, CommunityRequest.status, CommunityRequest.category)
                .where(CommunityRequest.organisation_id == org_id)
                .where(CommunityRequest.facility_id == facility_id)
                .where(CommunityRequest.channel == _DEMO_CHANNEL)
            )
        ).all()
        request_ids = [row[0] for row in rows]
        status_counts: dict[str, int] = {}
        category_counts: dict[str, int] = {}
        for _, status, category in rows:
            status_counts[status] = status_counts.get(status, 0) + 1
            category_counts[category] = category_counts.get(category, 0) + 1

        if not request_ids:
            print("Reach demo reset: no synthetic community requests matched.")
            print(f"organisationId={org_id}")
            print(f"facilityId={facility_id}")
            print("deletedRequests=0")
            return 0

        if not confirm_or_yes(
            yes=yes,
            prompt=(
                f"Delete {len(request_ids)} synthetic Reach request(s) "
                f"for {facility_id} / {org_id}?"
            ),
        ):
            print("Aborted. No rows deleted.", file=sys.stderr)
            return 1

        await session.execute(delete(CommunityRequest).where(CommunityRequest.id.in_(request_ids)))
        deleted_requests = len(request_ids)
        await session.commit()

    print("Reach demo reset complete.")
    print(f"organisationId={org_id}")
    print(f"facilityId={facility_id}")
    print(f"deletedRequests={deleted_requests}")
    print("preserved=accounts,roles,professional_profiles,clinical_records,unrelated_audit")
    for status, count in sorted(status_counts.items()):
        print(f"deletedStatus.{status}={count}")
    for category, count in sorted(category_counts.items()):
        print(f"deletedCategory.{category}={count}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Delete synthetic NorthCare Reach demonstration community requests "
            "(development only)."
        )
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip interactive confirmation (required for non-interactive automation).",
    )
    args = parser.parse_args(argv)
    return asyncio.run(reset_demo(yes=args.yes))


if __name__ == "__main__":
    raise SystemExit(main())
