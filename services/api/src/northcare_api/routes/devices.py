from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.deps import get_current_account
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.contracts.sync import DeviceRegisterRequest, DeviceRegisterResponse
from northcare_api.database import get_session
from northcare_api.services.device_registration import register_device

router = APIRouter(prefix="/v1/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRegisterResponse)
async def register(
    body: DeviceRegisterRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    session: AsyncSession = Depends(get_session),
) -> DeviceRegisterResponse:
    try:
        device = await register_device(session, account, body.device_id, body.user_agent)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail={"code": str(exc)}) from exc
    return DeviceRegisterResponse(deviceId=device.id, registered=True)
