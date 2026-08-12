"""Development-only professional profile configuration for Reach demo account.

Does not read, print, or change passwords.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import UTC, datetime

from sqlalchemy import select

from northcare_api.administration.email_normalisation import normalise_email
from northcare_api.administration.errors import AdministrationError
from northcare_api.administration.professional_profile import validate_professional_profile_input
from northcare_api.administration.service import load_active_roles, write_audit
from northcare_api.config import get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.enums import AccountRole
from northcare_api.domain.models import ServerAccount, WorkerProfessionalProfile


async def set_profile(
    *,
    email: str,
    profession: str,
    community_requests_enabled: bool,
    emergency_requests_enabled: bool,
    other_profession_description: str | None,
) -> int:
    settings = get_settings()
    if settings.northcare_env != "development":
        print(
            "Development professional profile setup is available only in development.",
            file=sys.stderr,
        )
        return 2

    try:
        normalised = normalise_email(email)
    except ValueError:
        print("A valid email address is required.", file=sys.stderr)
        return 2

    try:
        profile_input = validate_professional_profile_input(
            profession=profession,
            other_profession_description=other_profession_description,
            community_requests_enabled=community_requests_enabled,
            emergency_requests_enabled=emergency_requests_enabled,
        )
    except AdministrationError:
        print("Professional profile validation failed.", file=sys.stderr)
        return 2

    async with SessionLocal() as session:
        account = (
            await session.execute(
                select(ServerAccount).where(ServerAccount.normalised_email == normalised)
            )
        ).scalar_one_or_none()
        if account is None:
            print("Account not found. Provision the development account first.", file=sys.stderr)
            return 2

        roles = await load_active_roles(session, account.id)
        if AccountRole.WORKER not in roles:
            print("Account must include the worker role.", file=sys.stderr)
            return 2

        existing = await session.get(WorkerProfessionalProfile, account.id)
        created = existing is None
        now = datetime.now(UTC)
        if existing is None:
            existing = WorkerProfessionalProfile(
                account_id=account.id,
                profession=profile_input.profession,
                other_profession_description=profile_input.other_profession_description,
                community_requests_enabled=profile_input.community_requests_enabled,
                emergency_requests_enabled=profile_input.emergency_requests_enabled,
                version=1,
                created_at=now,
                updated_at=now,
            )
            session.add(existing)
        else:
            existing.profession = profile_input.profession
            existing.other_profession_description = profile_input.other_profession_description
            existing.community_requests_enabled = profile_input.community_requests_enabled
            existing.emergency_requests_enabled = profile_input.emergency_requests_enabled
            existing.version += 1
            existing.updated_at = now

        await write_audit(
            session,
            organisation_id=account.organisation_id,
            actor_account_id=account.id,
            target_account_id=account.id,
            event_type="developmentDemoProfessionalProfileConfigured",
            safe_metadata={
                "profession": existing.profession,
                "communityRequestsEnabled": existing.community_requests_enabled,
                "emergencyRequestsEnabled": existing.emergency_requests_enabled,
                "created": created,
                "profileVersion": existing.version,
            },
        )
        await session.commit()

        print("Development professional profile configured.")
        print(f"accountId={account.id}")
        print(f"roles={','.join(roles)}")
        print(f"facilityId={account.facility_id}")
        print(f"organisationId={account.organisation_id}")
        print(f"profession={existing.profession}")
        print(f"communityRequestsEnabled={existing.community_requests_enabled}")
        print(f"emergencyRequestsEnabled={existing.emergency_requests_enabled}")
        print(f"profileVersion={existing.version}")
        return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Set development professional profile without changing password."
    )
    parser.add_argument("--email", required=True)
    parser.add_argument("--profession", required=True)
    parser.add_argument(
        "--community-requests-enabled",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--no-community-requests-enabled",
        action="store_false",
        dest="community_requests_enabled",
    )
    parser.add_argument(
        "--emergency-requests-enabled",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--no-emergency-requests-enabled",
        action="store_false",
        dest="emergency_requests_enabled",
    )
    parser.add_argument("--other-profession-description", default=None)
    args = parser.parse_args(argv)
    return asyncio.run(
        set_profile(
            email=args.email,
            profession=args.profession,
            community_requests_enabled=args.community_requests_enabled,
            emergency_requests_enabled=args.emergency_requests_enabled,
            other_profession_description=args.other_profession_description,
        )
    )


if __name__ == "__main__":
    raise SystemExit(main())
