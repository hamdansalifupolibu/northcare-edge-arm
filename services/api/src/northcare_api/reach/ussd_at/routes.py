"""Africa's Talking USSD webhook routes (sandbox-only, Reach Stage T1)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import Response

from northcare_api.config import Settings, get_settings
from northcare_api.database import get_session
from northcare_api.reach.service import ReachService
from northcare_api.reach.ussd_at.adapter import (
    AtUssdGateError,
    handle_at_ussd_request,
    unavailable_reply,
    verify_callback_secret,
)
from northcare_api.reach.ussd_at.redaction import mask_session_id, safe_service_code
from northcare_api.reach.ussd_at.response import at_plain_text_response, end

logger = logging.getLogger("northcare_api.reach.ussd_at")

router = APIRouter(prefix="/v1/reach/ussd/africas-talking", tags=["reach-ussd-at"])

_MAX_BODY_BYTES = 8192


def _service(
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> ReachService:
    return ReachService(session, settings)


@router.post(
    "/{callbackSecret}",
    summary="Africa's Talking USSD callback (sandbox)",
    responses={
        200: {
            "content": {"text/plain": {"example": "CON NORTHCARE REACH\n..."}},
            "description": "Plain text CON/END body for Africa's Talking",
        }
    },
)
async def africas_talking_ussd_callback(
    callbackSecret: str,
    request: Request,
    service: ReachService = Depends(_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > _MAX_BODY_BYTES:
                raise HTTPException(status_code=413, detail={"code": "payloadTooLarge"})
        except ValueError:
            raise HTTPException(status_code=400, detail={"code": "invalidContentLength"}) from None

    try:
        verify_callback_secret(settings, callbackSecret)
    except AtUssdGateError as exc:
        logger.info("at_ussd_auth_rejected code=%s", exc.code)
        raise HTTPException(status_code=exc.http_status, detail={"code": exc.code}) from exc

    form = await request.form()
    form_dict = {str(key): (value if isinstance(value, str) else str(value)) for key, value in form.items()}
    logger.info(
        "at_ussd_http_hit method=%s service=%s text_empty=%s",
        request.method,
        safe_service_code(form_dict.get("serviceCode")),
        not bool((form_dict.get("text") or "").strip()),
    )

    try:
        reply = await handle_at_ussd_request(
            form=form_dict,
            settings=settings,
            service=service,
        )
    except AtUssdGateError as exc:
        logger.info(
            "at_ussd_gate_rejected code=%s session=%s",
            exc.code,
            mask_session_id(form_dict.get("sessionId")),
        )
        # Prefer USSD-safe END text for enabled-path soft failures; hard auth/flag mistakes return HTTP.
        if exc.code in {"atUssdDisabled", "reachDemoDisabled", "atUssdLiveRejected"}:
            raise HTTPException(status_code=exc.http_status, detail={"code": exc.code}) from exc
        if exc.code == "atUssdServiceCodeRejected":
            # AT treats non-200 / non-CON|END JSON as its stock landing page — end in plain text.
            return at_plain_text_response(
                end(
                    "This USSD service is not available on this channel.\nPlease try again later."
                ).to_plain_text()
            )
        if exc.code == "atUssdMisconfigured":
            raise HTTPException(status_code=exc.http_status, detail={"code": exc.code}) from exc
        if exc.code == "atUssdPayloadTooLarge":
            raise HTTPException(status_code=413, detail={"code": exc.code}) from exc
        if exc.code == "atUssdInvalidPayload":
            return at_plain_text_response(unavailable_reply().to_plain_text())
        raise HTTPException(status_code=exc.http_status, detail={"code": exc.code}) from exc
    except Exception:
        logger.exception("at_ussd_unhandled")
        return at_plain_text_response(unavailable_reply().to_plain_text())

    return at_plain_text_response(reply.to_plain_text())
