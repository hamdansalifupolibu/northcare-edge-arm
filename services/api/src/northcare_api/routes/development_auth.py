from __future__ import annotations

import time
from datetime import UTC, datetime

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.config import Settings, get_settings
from northcare_api.contracts.sync import DevelopmentTokenRequest, DevelopmentTokenResponse
from northcare_api.database import get_session
from northcare_api.domain.enums import RoleAssignmentStatus, permitted_workspaces, primary_role
from northcare_api.domain.models import DevelopmentCredential, ServerAccount, ServerAccountRole

router = APIRouter(prefix="/v1/development/auth", tags=["development-auth"])
_HASHER = PasswordHasher()
_GENERIC_AUTH_ERROR = HTTPException(status_code=401, detail={"code": "AUTH_REQUIRED"})


@router.post("/token", response_model=DevelopmentTokenResponse)
async def issue_development_token(
    body: DevelopmentTokenRequest,
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_session),
) -> DevelopmentTokenResponse:
    if not settings.development_auth_enabled:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})

    supplied_identifier = body.email or body.account_id or body.identifier
    if supplied_identifier is None:
        raise _GENERIC_AUTH_ERROR
    identifier = supplied_identifier.strip().lower()
    credential = (
        await session.execute(
            select(DevelopmentCredential).where(
                or_(
                    DevelopmentCredential.email == identifier,
                    DevelopmentCredential.account_id == supplied_identifier.strip(),
                )
            )
        )
    ).scalar_one_or_none()
    if credential is None:
        raise _GENERIC_AUTH_ERROR
    try:
        _HASHER.verify(credential.password_hash, body.password)
    except (VerifyMismatchError, InvalidHashError):
        raise _GENERIC_AUTH_ERROR

    account = await session.get(ServerAccount, credential.account_id)
    if account is None or not account.is_active or account.account_status == "inactive":
        raise _GENERIC_AUTH_ERROR
    if account.first_login_required and account.account_status == "pendingFirstLogin":
        # Token may still be issued so the client can complete first-login change.
        pass

    roles = list(
        (
            await session.execute(
                select(ServerAccountRole.role).where(
                    ServerAccountRole.account_id == account.id,
                    ServerAccountRole.status == RoleAssignmentStatus.ACTIVE,
                )
            )
        ).scalars().all()
    )
    if not roles:
        roles = [account.role]

    now = int(time.time())
    token = jwt.encode(
        {
            "sub": account.remote_subject,
            "email": credential.email,
            "iat": now,
            "exp": now + 3600,
            "iss": "northcare-development",
        },
        settings.dev_auth_secret,
        algorithm="HS256",
    )
    access_token = token.decode() if isinstance(token, bytes) else token
    account.last_remote_sign_in_at = datetime.now(UTC)
    await session.commit()
    return DevelopmentTokenResponse(
        access_token=access_token,
        account_id=account.id,
        role=primary_role(roles),
        roles=roles,
        permitted_workspaces=permitted_workspaces(roles),
        facility_id=account.facility_id,
        organisation_id=account.organisation_id,
        account_status=account.account_status,
        first_login_required=account.first_login_required,
        display_name=account.display_name,
        account_version=account.account_version,
    )
