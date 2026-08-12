from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.access_token_verifier import AccessTokenVerifier
from northcare_api.auth.development_verifier import DevelopmentAccessTokenVerifier
from northcare_api.auth.firebase_verifier import FirebaseAccessTokenVerifier
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.auth.unavailable_verifier import UnavailableAccessTokenVerifier
from northcare_api.config import Settings, get_settings
from northcare_api.database import get_session
from northcare_api.domain.enums import RoleAssignmentStatus, primary_role
from northcare_api.domain.models import ServerAccount, ServerAccountRole


def build_access_token_verifier(settings: Settings) -> AccessTokenVerifier:
    if settings.northcare_env in ("development", "test"):
        return DevelopmentAccessTokenVerifier(settings.dev_auth_secret)
    if settings.firebase_configured:
        return FirebaseAccessTokenVerifier(
            settings.firebase_project_id,
            settings.google_application_credentials,
        )
    return UnavailableAccessTokenVerifier()


@dataclass(frozen=True, slots=True)
class AuthContext:
    account: AuthenticatedAccount
    token_issued_at: int | None


async def _load_authenticated_account(
    authorization: str | None,
    settings: Settings,
    session: AsyncSession,
) -> AuthContext:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail={"code": "AUTH_REQUIRED"})
    token = authorization.split(" ", 1)[1].strip()
    verifier = build_access_token_verifier(settings)
    try:
        identity = await verifier.verify(token)
    except PermissionError as exc:
        code = str(exc) or "AUTH_REQUIRED"
        status = 503 if code == "AUTH_UNAVAILABLE" else 401
        raise HTTPException(status_code=status, detail={"code": code}) from exc

    result = await session.execute(
        select(ServerAccount).where(ServerAccount.remote_subject == identity.subject)
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=403, detail={"code": "ACCOUNT_INACTIVE"})
    if not account.is_active or account.account_status == "inactive":
        raise HTTPException(status_code=403, detail={"code": "ACCOUNT_INACTIVE"})

    role_rows = (
        await session.execute(
            select(ServerAccountRole.role).where(
                ServerAccountRole.account_id == account.id,
                ServerAccountRole.status == RoleAssignmentStatus.ACTIVE,
            )
        )
    ).scalars().all()
    roles = tuple(role_rows) if role_rows else (account.role,)
    authenticated = AuthenticatedAccount(
        account_id=account.id,
        remote_subject=account.remote_subject,
        display_name=account.display_name,
        role=primary_role(list(roles)),
        roles=roles,
        organisation_id=account.organisation_id,
        facility_id=account.facility_id,
        is_active=account.is_active,
        account_status=account.account_status,
        account_version=account.account_version,
        first_login_required=account.first_login_required,
        normalised_email=account.normalised_email,
        identity_provider=account.identity_provider,
    )
    return AuthContext(account=authenticated, token_issued_at=identity.token_issued_at)


async def get_auth_context(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
) -> AuthContext:
    return await _load_authenticated_account(authorization, settings, session)


async def get_current_account(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
) -> AuthenticatedAccount:
    context = await _load_authenticated_account(authorization, settings, session)
    return context.account
