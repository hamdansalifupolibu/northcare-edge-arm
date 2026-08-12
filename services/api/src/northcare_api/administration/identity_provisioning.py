from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from argon2 import PasswordHasher
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.administration.errors import (
    IDENTITY_PROVIDER_UNAVAILABLE,
    IDENTITY_PROVISIONING_FAILED,
    PASSWORD_RESET_UNAVAILABLE,
)
from northcare_api.administration.policies import password_meets_policy
from northcare_api.config import Settings
from northcare_api.domain.models import DevelopmentCredential, ServerAccount

_HASHER = PasswordHasher()


@dataclass(frozen=True, slots=True)
class ProvisionedIdentity:
    provider: str
    remote_subject: str
    email: str


class IdentityProvisioningProvider(Protocol):
    provider_id: str

    async def create_worker_identity(
        self,
        session: AsyncSession,
        *,
        account_id: str,
        email: str,
        temporary_password: str,
    ) -> ProvisionedIdentity: ...

    async def disable_identity(self, session: AsyncSession, account: ServerAccount) -> None: ...

    async def enable_identity(self, session: AsyncSession, account: ServerAccount) -> None: ...

    async def initiate_password_reset(
        self,
        session: AsyncSession,
        account: ServerAccount,
        *,
        temporary_password: str,
    ) -> None: ...

    async def require_password_change(
        self, session: AsyncSession, account: ServerAccount
    ) -> None: ...

    async def change_password(
        self,
        session: AsyncSession,
        account: ServerAccount,
        *,
        current_password: str,
        new_password: str,
    ) -> None: ...


class DevelopmentIdentityProvisioningProvider:
    provider_id = "development"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def create_worker_identity(
        self,
        session: AsyncSession,
        *,
        account_id: str,
        email: str,
        temporary_password: str,
    ) -> ProvisionedIdentity:
        if self._settings.northcare_env not in ("development", "test"):
            raise IDENTITY_PROVIDER_UNAVAILABLE
        if not password_meets_policy(temporary_password):
            raise IDENTITY_PROVISIONING_FAILED
        existing = await session.get(DevelopmentCredential, email)
        if existing is not None and existing.account_id != account_id:
            raise IDENTITY_PROVISIONING_FAILED
        if existing is None:
            session.add(
                DevelopmentCredential(
                    email=email,
                    account_id=account_id,
                    password_hash=_HASHER.hash(temporary_password),
                    hash_algorithm="argon2id-v1",
                )
            )
        else:
            existing.password_hash = _HASHER.hash(temporary_password)
            existing.hash_algorithm = "argon2id-v1"
        return ProvisionedIdentity(
            provider=self.provider_id,
            remote_subject=account_id,
            email=email,
        )

    async def disable_identity(self, session: AsyncSession, account: ServerAccount) -> None:
        # Development identities remain stored; account status gates authentication.
        _ = session, account

    async def enable_identity(self, session: AsyncSession, account: ServerAccount) -> None:
        _ = session, account

    async def initiate_password_reset(
        self,
        session: AsyncSession,
        account: ServerAccount,
        *,
        temporary_password: str,
    ) -> None:
        if self._settings.northcare_env not in ("development", "test"):
            raise PASSWORD_RESET_UNAVAILABLE
        if not password_meets_policy(temporary_password):
            raise IDENTITY_PROVISIONING_FAILED
        if not account.normalised_email:
            raise PASSWORD_RESET_UNAVAILABLE
        credential = await session.get(DevelopmentCredential, account.normalised_email)
        if credential is None:
            credential = DevelopmentCredential(
                email=account.normalised_email,
                account_id=account.id,
                password_hash=_HASHER.hash(temporary_password),
                hash_algorithm="argon2id-v1",
            )
            session.add(credential)
        else:
            credential.password_hash = _HASHER.hash(temporary_password)
            credential.hash_algorithm = "argon2id-v1"

    async def require_password_change(
        self, session: AsyncSession, account: ServerAccount
    ) -> None:
        account.first_login_required = True
        _ = session

    async def change_password(
        self,
        session: AsyncSession,
        account: ServerAccount,
        *,
        current_password: str,
        new_password: str,
    ) -> None:
        if not account.normalised_email:
            raise IDENTITY_PROVISIONING_FAILED
        if not password_meets_policy(new_password):
            raise IDENTITY_PROVISIONING_FAILED
        credential = await session.get(DevelopmentCredential, account.normalised_email)
        if credential is None:
            raise IDENTITY_PROVISIONING_FAILED
        try:
            _HASHER.verify(credential.password_hash, current_password)
        except Exception as exc:
            raise IDENTITY_PROVISIONING_FAILED from exc
        credential.password_hash = _HASHER.hash(new_password)
        credential.hash_algorithm = "argon2id-v1"


class FirebaseIdentityProvisioningProvider:
    """Boundary only — inactive without production Firebase Admin configuration."""

    provider_id = "firebase"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def create_worker_identity(self, *args, **kwargs) -> ProvisionedIdentity:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def disable_identity(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def enable_identity(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def initiate_password_reset(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise PASSWORD_RESET_UNAVAILABLE

    async def require_password_change(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def change_password(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE


class UnavailableIdentityProvisioningProvider:
    provider_id = "unavailable"

    async def create_worker_identity(self, *args, **kwargs) -> ProvisionedIdentity:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def disable_identity(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def enable_identity(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def initiate_password_reset(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise PASSWORD_RESET_UNAVAILABLE

    async def require_password_change(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE

    async def change_password(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise IDENTITY_PROVIDER_UNAVAILABLE


def build_identity_provisioning_provider(settings: Settings) -> IdentityProvisioningProvider:
    if settings.northcare_env in ("development", "test"):
        return DevelopmentIdentityProvisioningProvider(settings)
    if settings.firebase_configured:
        return FirebaseIdentityProvisioningProvider(settings)
    return UnavailableIdentityProvisioningProvider()


async def get_development_credential_for_account(
    session: AsyncSession, account_id: str
) -> DevelopmentCredential | None:
    result = await session.execute(
        select(DevelopmentCredential).where(DevelopmentCredential.account_id == account_id)
    )
    return result.scalar_one_or_none()
