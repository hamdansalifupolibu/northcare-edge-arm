from __future__ import annotations

from typing import cast

from argon2 import PasswordHasher
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.domain.enums import AccountRole, AccountStatus, RoleAssignmentStatus
from northcare_api.domain.models import (
    DevelopmentCredential,
    ServerAccount,
    ServerAccountRole,
    ServerFacility,
)

SYNTHETIC_FACILITIES = [
    {
        "id": "fac-dev-001",
        "name": "Demo CHPS Compound",
        "organisation_id": "org-dev-001",
        "district": "Northern Region (synthetic)",
        "region": "Northern",
        "facility_type": "CHPS",
    },
    {
        "id": "fac-dev-hq",
        "name": "Demo District Health Office",
        "organisation_id": "org-dev-001",
        "district": "Northern Region (synthetic)",
        "region": "Northern",
        "facility_type": "District office",
    },
]

SYNTHETIC_ACCOUNTS = [
    {
        "id": "dev-worker-001",
        "remote_subject": "dev-worker-001",
        "display_name": "Synthetic Worker",
        "role": AccountRole.WORKER,
        "organisation_id": "org-dev-001",
        "facility_id": "fac-dev-001",
        "is_active": True,
        "account_status": AccountStatus.ACTIVE,
        "normalised_email": "dev-worker-001@development.invalid",
        "identity_provider": "development",
        "roles": [AccountRole.WORKER],
    },
    {
        "id": "dev-worker-temp",
        "remote_subject": "dev-worker-temp",
        "display_name": "Synthetic Worker (temp password)",
        "role": AccountRole.WORKER,
        "organisation_id": "org-dev-001",
        "facility_id": "fac-dev-001",
        "is_active": True,
        "account_status": AccountStatus.PENDING_FIRST_LOGIN,
        "first_login_required": True,
        "normalised_email": "dev-worker-temp@development.invalid",
        "identity_provider": "development",
        "roles": [AccountRole.WORKER],
    },
    {
        "id": "dev-admin-001",
        "remote_subject": "dev-admin-001",
        "display_name": "Synthetic Administrator",
        "role": AccountRole.ADMIN,
        "organisation_id": "org-dev-001",
        "facility_id": "fac-dev-hq",
        "is_active": True,
        "account_status": AccountStatus.ACTIVE,
        "normalised_email": "dev-admin-001@development.invalid",
        "identity_provider": "development",
        "roles": [AccountRole.ADMIN],
    },
    {
        "id": "dev-worker-inactive",
        "remote_subject": "dev-worker-inactive",
        "display_name": "Synthetic Inactive Worker",
        "role": AccountRole.WORKER,
        "organisation_id": "org-dev-001",
        "facility_id": "fac-dev-001",
        "is_active": False,
        "account_status": AccountStatus.INACTIVE,
        "normalised_email": "dev-worker-inactive@development.invalid",
        "identity_provider": "development",
        "roles": [AccountRole.WORKER],
    },
]

# Passwords mirror mobile DevelopmentAuthProvider — synthetic only.
DEV_PASSWORDS = {
    "dev-worker-001": "WorkerDemo1!",
    "dev-worker-temp": "TempPass1!",
    "dev-admin-001": "AdminDemo1!",
}
_HASHER = PasswordHasher()


async def seed_synthetic(session: AsyncSession) -> None:
    for facility in SYNTHETIC_FACILITIES:
        existing = await session.get(ServerFacility, facility["id"])
        if existing is None:
            session.add(ServerFacility(**facility, is_active=True))
    await session.flush()
    for account in SYNTHETIC_ACCOUNTS:
        roles = list(cast(list[AccountRole], account["roles"]))
        payload = {key: value for key, value in account.items() if key != "roles"}
        payload.setdefault("account_version", 1)
        payload.setdefault("first_login_required", False)
        payload.setdefault("identity_provider", "development")
        account_result = await session.execute(
            select(ServerAccount).where(ServerAccount.id == account["id"])
        )
        row = account_result.scalar_one_or_none()
        if row is None:
            session.add(ServerAccount(**payload))
        else:
            for key, value in payload.items():
                if key == "id":
                    continue
                setattr(row, key, value)
        await session.flush()
        for role in roles:
            role_id = f"role-{account['id']}-{role}"
            existing_role = await session.get(ServerAccountRole, role_id)
            if existing_role is None:
                session.add(
                    ServerAccountRole(
                        id=role_id,
                        account_id=account["id"],
                        role=role,
                        status=RoleAssignmentStatus.ACTIVE,
                    )
                )
            else:
                existing_role.status = RoleAssignmentStatus.ACTIVE
                existing_role.revoked_at = None
    await session.flush()
    for account_id, password in DEV_PASSWORDS.items():
        email = f"{account_id}@development.invalid"
        credential = await session.get(DevelopmentCredential, email)
        if credential is None:
            session.add(
                DevelopmentCredential(
                    email=email,
                    account_id=account_id,
                    password_hash=_HASHER.hash(password),
                    hash_algorithm="argon2id-v1",
                )
            )
    await session.commit()
