from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.contracts.sync import SyncChangeItem, SyncPullResponse
from northcare_api.domain.models import SyncChange
from northcare_api.security.cursors import CursorCodec, SyncCursor


async def pull_changes(
    session: AsyncSession,
    account: AuthenticatedAccount,
    *,
    cursor_token: str | None,
    limit: int,
    signing_secret: str,
    protocol_version: int,
) -> SyncPullResponse:
    codec = CursorCodec(signing_secret)
    after = 0
    if cursor_token:
        cursor = codec.decode(
            cursor_token,
            account_id=account.account_id,
            organisation_id=account.organisation_id,
            facility_id=account.facility_id,
            role=account.role,
        )
        after = cursor.sequence

    query = (
        select(SyncChange)
        .where(SyncChange.id > after)
        .where(SyncChange.organisation_id == account.organisation_id)
        .order_by(SyncChange.id.asc())
        .limit(limit + 1)
    )
    if not account.has_admin_role:
        query = query.where(SyncChange.facility_id == account.facility_id)

    rows = list((await session.execute(query)).scalars().all())
    has_more = len(rows) > limit
    page = rows[:limit]
    changes = [
        SyncChangeItem(
            changeId=str(row.id),
            entityType=row.entity_type,
            entityId=row.entity_id,
            operation="delete" if row.operation == "delete" or row.is_deleted else "upsert",
            serverVersion=row.server_version,
            payload=row.payload,
            deleted=bool(row.is_deleted or row.operation == "delete"),
            changedAt=row.changed_at.isoformat(),
        )
        for row in page
    ]
    next_cursor = None
    if page:
        last = page[-1]
        next_cursor = codec.encode(
            SyncCursor(
                sequence=last.id,
                account_id=account.account_id,
                organisation_id=account.organisation_id,
                facility_id=account.facility_id,
                role=account.role,
            )
        )
    return SyncPullResponse(
        protocolVersion=protocol_version,
        changes=changes,
        nextCursor=next_cursor,
        hasMore=has_more,
    )
