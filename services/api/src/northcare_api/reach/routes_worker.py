"""Worker Community Request APIs (development Reach gate required)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.deps import get_current_account
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.config import Settings, get_settings
from northcare_api.database import get_session
from northcare_api.reach.enums import CommunityRequestListFilter
from northcare_api.reach.errors import ReachError
from northcare_api.reach.schemas import (
    WorkerMutationResponse,
    WorkerRequestDetailResponse,
    WorkerRequestListResponse,
    WorkerVersionMutationRequest,
)
from northcare_api.reach.service import ReachService

router = APIRouter(prefix="/v1/worker/community-requests", tags=["reach-worker"])


def _http_error(error: ReachError) -> HTTPException:
    return HTTPException(status_code=error.http_status, detail={"code": error.code})


def _service(
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> ReachService:
    return ReachService(session, settings)


@router.get("", response_model=WorkerRequestListResponse)
async def list_community_requests(
    filter: CommunityRequestListFilter = Query(default=CommunityRequestListFilter.AWAITING),
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ReachService = Depends(_service),
) -> WorkerRequestListResponse:
    try:
        return await service.list_worker_requests(account, list_filter=filter)
    except ReachError as exc:
        raise _http_error(exc) from exc


@router.get("/{request_id}", response_model=WorkerRequestDetailResponse)
async def get_community_request(
    request_id: str,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ReachService = Depends(_service),
) -> WorkerRequestDetailResponse:
    try:
        return await service.get_worker_request(account, request_id)
    except ReachError as exc:
        raise _http_error(exc) from exc


@router.post("/{request_id}/acknowledge", response_model=WorkerMutationResponse)
async def acknowledge_community_request(
    request_id: str,
    body: WorkerVersionMutationRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ReachService = Depends(_service),
) -> WorkerMutationResponse:
    try:
        return await service.acknowledge(
            account, request_id, expected_version=body.expected_version
        )
    except ReachError as exc:
        raise _http_error(exc) from exc


@router.post("/{request_id}/contact-attempt", response_model=WorkerMutationResponse)
async def contact_attempt_community_request(
    request_id: str,
    body: WorkerVersionMutationRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ReachService = Depends(_service),
) -> WorkerMutationResponse:
    try:
        return await service.contact_attempt(
            account, request_id, expected_version=body.expected_version
        )
    except ReachError as exc:
        raise _http_error(exc) from exc


@router.post("/{request_id}/escalate", response_model=WorkerMutationResponse)
async def escalate_community_request(
    request_id: str,
    body: WorkerVersionMutationRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ReachService = Depends(_service),
) -> WorkerMutationResponse:
    try:
        return await service.escalate(
            account, request_id, expected_version=body.expected_version
        )
    except ReachError as exc:
        raise _http_error(exc) from exc


@router.post("/{request_id}/handle", response_model=WorkerMutationResponse)
async def handle_community_request(
    request_id: str,
    body: WorkerVersionMutationRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ReachService = Depends(_service),
) -> WorkerMutationResponse:
    try:
        return await service.handle(
            account, request_id, expected_version=body.expected_version
        )
    except ReachError as exc:
        raise _http_error(exc) from exc
