from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.deps import get_current_account
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.config import Settings, get_settings
from northcare_api.contracts.sync import (
    ConflictItem,
    ConflictListResponse,
    ConflictResolveRequest,
    ConflictResolveResponse,
    SyncPullResponse,
    SyncPushRequest,
    SyncPushResponse,
)
from northcare_api.database import get_session
from northcare_api.services.conflict_resolution import list_open_conflicts, resolve_conflict
from northcare_api.services.sync_pull import pull_changes
from northcare_api.services.sync_push import push_operations

router = APIRouter(prefix="/v1/sync", tags=["sync"])


@router.post("/push", response_model=SyncPushResponse)
async def sync_push(
    body: SyncPushRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> SyncPushResponse:
    if body.protocol_version != settings.sync_protocol_version:
        raise HTTPException(status_code=400, detail={"code": "PROTOCOL_VERSION_UNSUPPORTED"})
    try:
        results = await push_operations(session, account, body.device_id, body.operations)
    except PermissionError as exc:
        code = str(exc)
        status = 400 if code == "DEVICE_NOT_REGISTERED" else 403
        raise HTTPException(status_code=status, detail={"code": code}) from exc
    return SyncPushResponse(protocolVersion=settings.sync_protocol_version, results=results)


@router.get("/changes", response_model=SyncPullResponse)
async def sync_changes(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    account: AuthenticatedAccount = Depends(get_current_account),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> SyncPullResponse:
    try:
        return await pull_changes(
            session,
            account,
            cursor_token=cursor,
            limit=limit,
            signing_secret=settings.cursor_signing_secret,
            protocol_version=settings.sync_protocol_version,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"code": str(exc)}) from exc


@router.get("/conflicts", response_model=ConflictListResponse)
async def conflicts(
    account: AuthenticatedAccount = Depends(get_current_account),
    session: AsyncSession = Depends(get_session),
) -> ConflictListResponse:
    rows = await list_open_conflicts(session, account)
    return ConflictListResponse(
        conflicts=[
            ConflictItem(
                conflictId=row.id,
                entityType=row.entity_type,
                entityId=row.entity_id,
                conflictClass=row.conflict_class,
                status=row.status,
                baseServerVersion=row.base_server_version,
                serverVersion=row.server_version,
                createdAt=row.created_at.isoformat(),
            )
            for row in rows
        ]
    )


@router.post("/conflicts/{conflict_id}/resolve", response_model=ConflictResolveResponse)
async def resolve(
    conflict_id: str,
    body: ConflictResolveRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    session: AsyncSession = Depends(get_session),
) -> ConflictResolveResponse:
    try:
        conflict = await resolve_conflict(session, account, conflict_id, body.action)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"}) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail={"code": str(exc)}) from exc
    return ConflictResolveResponse(
        conflictId=conflict.id,
        status=conflict.status,
        resolution=conflict.resolution or body.action,
    )
