"""Development-only multi-role account provisioning.

Password is accepted only via getpass (or secure stdin for non-interactive local
provision). Never pass passwords as CLI arguments.
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
import sys
import uuid

from argon2 import PasswordHasher

from northcare_api.administration.email_normalisation import normalise_email
from northcare_api.administration.policies import password_meets_policy
from northcare_api.administration.service import ensure_role_assignment, write_audit
from northcare_api.config import get_settings
from northcare_api.database import SessionLocal
from northcare_api.domain.enums import (
    AccountRole,
    AccountStatus,
    canonical_role,
)
from northcare_api.domain.models import DevelopmentCredential, ServerAccount, ServerFacility

_HASHER = PasswordHasher()
_SUPPORTED = {AccountRole.WORKER, AccountRole.ADMIN}


def _read_password(*, non_interactive: bool) -> str:
    if non_interactive:
        # Secure stdin for local automation — never written to disk by this CLI.
        password = sys.stdin.readline().rstrip("\n")
        confirmation = sys.stdin.readline().rstrip("\n")
    else:
        password = getpass.getpass("Development account password: ")
        confirmation = getpass.getpass("Confirm development account password: ")
    if password != confirmation or not password_meets_policy(password):
        raise ValueError("credential_policy_failed")
    return password


async def provision(
    email: str,
    roles: list[str],
    *,
    update_existing: bool,
    non_interactive: bool = False,
) -> int:
    settings = get_settings()
    if settings.northcare_env != "development":
        print("Development account provisioning is available only in development.", file=sys.stderr)
        return 2
    try:
        normalised = normalise_email(email)
    except ValueError:
        print("A valid email address is required.", file=sys.stderr)
        return 2

    try:
        canonical_roles = sorted({canonical_role(role) for role in roles})
    except ValueError:
        print("Supported development roles are worker and admin.", file=sys.stderr)
        return 2
    if not canonical_roles or any(role not in _SUPPORTED for role in canonical_roles):
        print("Supported development roles are worker and admin.", file=sys.stderr)
        return 2

    try:
        password = _read_password(non_interactive=non_interactive)
    except ValueError:
        print("Credential policy validation failed.", file=sys.stderr)
        return 2

    async with SessionLocal() as session:
        facility = await session.get(ServerFacility, "fac-dev-001")
        if facility is None:
            print(
                "Synthetic development facility is unavailable. Seed development data first.",
                file=sys.stderr,
            )
            return 2

        credential = await session.get(DevelopmentCredential, normalised)
        account: ServerAccount | None = None
        if credential is not None:
            if not update_existing:
                print(
                    "A development credential already exists. Re-run with --update-existing.",
                    file=sys.stderr,
                )
                return 2
            account = await session.get(ServerAccount, credential.account_id)
        if account is None:
            account_id = f"dev-dual-{uuid.uuid5(uuid.NAMESPACE_URL, normalised).hex[:20]}"
            account = await session.get(ServerAccount, account_id)
            if account is None:
                account = ServerAccount(
                    id=account_id,
                    remote_subject=account_id,
                    display_name="Development Dual-Role Account",
                    role=AccountRole.WORKER if AccountRole.WORKER in canonical_roles else AccountRole.ADMIN,
                    organisation_id="org-dev-001",
                    facility_id="fac-dev-001",
                    is_active=True,
                    account_version=1,
                    account_status=AccountStatus.ACTIVE,
                    normalised_email=normalised,
                    first_login_required=False,
                    identity_provider="development",
                )
                session.add(account)
                await session.flush()
            if credential is None:
                credential = DevelopmentCredential(
                    email=normalised,
                    account_id=account.id,
                    password_hash=_HASHER.hash(password),
                    hash_algorithm="argon2id-v1",
                )
                session.add(credential)
            else:
                credential.account_id = account.id
                credential.password_hash = _HASHER.hash(password)
                credential.hash_algorithm = "argon2id-v1"
        else:
            # Account was resolved from an existing development credential.
            assert credential is not None
            credential.password_hash = _HASHER.hash(password)
            credential.hash_algorithm = "argon2id-v1"
            account.normalised_email = normalised
            account.identity_provider = "development"
            account.is_active = True
            if account.account_status == AccountStatus.INACTIVE:
                account.account_status = AccountStatus.ACTIVE
            if AccountRole.WORKER in canonical_roles:
                account.facility_id = "fac-dev-001"
            account.account_version += 1

        for role in canonical_roles:
            await ensure_role_assignment(
                session,
                account_id=account.id,
                role=role,
                assigned_by=None,
            )
        account.role = (
            AccountRole.WORKER if AccountRole.WORKER in canonical_roles else AccountRole.ADMIN
        )
        await write_audit(
            session,
            organisation_id=account.organisation_id,
            actor_account_id="cli:provision_development_account",
            target_account_id=account.id,
            event_type="developmentDualRoleProvisioned",
            safe_metadata={"roles": canonical_roles},
        )
        await session.commit()

    print("Development account provisioned.")
    print(f"account_id={account.id}")
    print(f"email={normalised}")
    print(f"roles={','.join(canonical_roles)}")
    print("worker_facility_id=fac-dev-001")
    print("organisation_id=org-dev-001")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Provision a development multi-role account (getpass / stdin only)."
    )
    parser.add_argument("--email", required=True)
    parser.add_argument(
        "--roles",
        nargs="+",
        required=True,
        help="One or more of: worker admin",
    )
    parser.add_argument("--update-existing", action="store_true")
    parser.add_argument(
        "--stdin-password",
        action="store_true",
        help="Read password and confirmation from stdin (local automation only).",
    )
    arguments = parser.parse_args()
    return asyncio.run(
        provision(
            arguments.email,
            arguments.roles,
            update_existing=arguments.update_existing,
            non_interactive=arguments.stdin_password,
        )
    )


if __name__ == "__main__":
    raise SystemExit(main())
