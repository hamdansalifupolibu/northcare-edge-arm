from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.domain.enums import DeviceStatus
from northcare_api.domain.models import RegisteredDevice


async def register_device(
    session: AsyncSession,
    account: AuthenticatedAccount,
    device_id: str,
    user_agent: str | None,
) -> RegisteredDevice:
    existing = await session.get(RegisteredDevice, device_id)
    now = datetime.now(UTC)
    if existing is not None:
        if existing.account_id != account.account_id:
            raise PermissionError("SCOPE_VIOLATION")
        if existing.status == DeviceStatus.REVOKED:
            raise PermissionError("DEVICE_REVOKED")
        existing.last_seen_at = now
        existing.status = DeviceStatus.ACTIVE
        if user_agent:
            existing.user_agent = user_agent
        await session.commit()
        await session.refresh(existing)
        return existing
    device = RegisteredDevice(
        id=device_id,
        account_id=account.account_id,
        user_agent=user_agent,
        status=DeviceStatus.ACTIVE,
        created_at=now,
        last_seen_at=now,
    )
    session.add(device)
    await session.commit()
    await session.refresh(device)
    return device
