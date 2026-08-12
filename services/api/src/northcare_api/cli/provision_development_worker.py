"""Development-only worker credential provisioning; never accepts a password argument."""

from __future__ import annotations

import argparse
import asyncio
import getpass
import re
import sys

from argon2 import PasswordHasher

from northcare_api.administration.service import ensure_role_assignment
from northcare_api.config import get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.enums import AccountRole, AccountStatus
from northcare_api.domain.models import DevelopmentCredential, ServerAccount, ServerFacility

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_HASHER = PasswordHasher()


def _valid_password(value: str) -> bool:
    return (
        len(value) >= 12
        and any(character.islower() for character in value)
        and any(character.isupper() for character in value)
        and any(character.isdigit() for character in value)
    )


async def provision(email: str, update: bool) -> int:
    settings = get_settings()
    if settings.northcare_env != "development":
        print("Development worker provisioning is available only in development.", file=sys.stderr)
        return 2
    normalized_email = email.strip().lower()
    if not _EMAIL.fullmatch(normalized_email):
        print("A valid email address is required.", file=sys.stderr)
        return 2

    password = getpass.getpass("Development worker password: ")
    confirmation = getpass.getpass("Confirm development worker password: ")
    if password != confirmation or not _valid_password(password):
        print("Credential policy validation failed.", file=sys.stderr)
        return 2

    async with SessionLocal() as session:
        facility = await session.get(ServerFacility, "fac-dev-001")
        if facility is None:
            print("Synthetic development facility is unavailable. Seed development data first.", file=sys.stderr)
            return 2
        credential = await session.get(DevelopmentCredential, normalized_email)
        if credential is not None and not update:
            print("A development credential already exists. Re-run with --update to replace it.", file=sys.stderr)
            return 2
        if credential is None:
            account_id = f"dev-worker-{normalized_email.encode().hex()[:20]}"
            account = await session.get(ServerAccount, account_id)
            if account is None:
                account = ServerAccount(
                    id=account_id,
                    remote_subject=account_id,
                    display_name="Development Worker",
                    role=AccountRole.WORKER,
                    organisation_id="org-dev-001",
                    facility_id="fac-dev-001",
                    is_active=True,
                    account_version=1,
                    account_status=AccountStatus.ACTIVE,
                    normalised_email=normalized_email,
                    identity_provider="development",
                )
                session.add(account)
                await session.flush()
            credential = DevelopmentCredential(
                email=normalized_email,
                account_id=account_id,
                password_hash=_HASHER.hash(password),
                hash_algorithm="argon2id-v1",
            )
            session.add(credential)
        else:
            credential.password_hash = _HASHER.hash(password)
            credential.hash_algorithm = "argon2id-v1"
            account = await session.get(ServerAccount, credential.account_id)
            if account is not None:
                account.normalised_email = normalized_email
                account.identity_provider = "development"
        account_id = credential.account_id
        await ensure_role_assignment(
            session,
            account_id=account_id,
            role=AccountRole.WORKER,
            assigned_by=None,
        )
        await session.commit()
    print("Development worker credential provisioned for the synthetic facility.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--update", action="store_true")
    arguments = parser.parse_args()
    return asyncio.run(provision(arguments.email, arguments.update))


if __name__ == "__main__":
    raise SystemExit(main())
