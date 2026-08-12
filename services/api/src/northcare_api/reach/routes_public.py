"""Public Reach endpoints (development demo gate required)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.config import Settings, get_settings
from northcare_api.database import get_session
from northcare_api.reach.errors import ReachError
from northcare_api.reach.schemas import (
    PublicCreateRequest,
    PublicCreateResponse,
    PublicStatusRequest,
    PublicStatusResponse,
)
from northcare_api.reach.service import ReachService, require_reach_enabled

router = APIRouter(prefix="/v1/reach", tags=["reach-public"])


def _http_error(error: ReachError) -> HTTPException:
    return HTTPException(status_code=error.http_status, detail={"code": error.code})


def _service(
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> ReachService:
    return ReachService(session, settings)


@router.post("/requests", response_model=PublicCreateResponse)
async def create_community_request(
    body: PublicCreateRequest,
    request: Request,
    service: ReachService = Depends(_service),
    settings: Settings = Depends(get_settings),
) -> PublicCreateResponse:
    try:
        require_reach_enabled(settings)
        # Reject oversized bodies early (defence in depth; ASGI may already limit).
        content_length = request.headers.get("content-length")
        if content_length is not None and int(content_length) > 8192:
            raise HTTPException(status_code=413, detail={"code": "payloadTooLarge"})
        payload = body.model_dump(by_alias=True)
        return await service.create_public_request(payload)
    except ReachError as exc:
        raise _http_error(exc) from exc


@router.post("/requests/status", response_model=PublicStatusResponse)
async def lookup_community_request_status(
    body: PublicStatusRequest,
    service: ReachService = Depends(_service),
    settings: Settings = Depends(get_settings),
) -> PublicStatusResponse:
    try:
        require_reach_enabled(settings)
        return await service.public_status_lookup(
            reference_code=body.reference_code.strip(),
            status_pin=body.status_pin,
        )
    except ReachError as exc:
        raise _http_error(exc) from exc
