from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.domain.models import SyncConflict, SyncRecord
from northcare_api.services.sync_push import _append_change

CLINICAL_CLASSES = {
    "versionedCompletedClinical",
    "serverAuthoritative",
    "appendOnly",
}


async def list_open_conflicts(
    session: AsyncSession, account: AuthenticatedAccount
) -> list[SyncConflict]:
    query = select(SyncConflict).where(
        SyncConflict.status == "open",
        SyncConflict.organisation_id == account.organisation_id,
    )
    if not account.has_admin_role:
        query = query.where(SyncConflict.facility_id == account.facility_id)
    result = await session.execute(query.order_by(SyncConflict.created_at.desc()))
    return list(result.scalars().all())


async def resolve_conflict(
    session: AsyncSession,
    account: AuthenticatedAccount,
    conflict_id: str,
    action: str,
) -> SyncConflict:
    conflict = await session.get(SyncConflict, conflict_id)
    if conflict is None:
        raise LookupError("NOT_FOUND")
    if conflict.organisation_id != account.organisation_id:
        raise PermissionError("SCOPE_VIOLATION")
    if not account.has_admin_role and conflict.facility_id != account.facility_id:
        raise PermissionError("SCOPE_VIOLATION")
    if conflict.status != "open":
        return conflict

    # Controlled: chooseLocal for completed clinical records keeps them for review, not auto merge.
    if action == "chooseLocal" and conflict.conflict_class == "versionedCompletedClinical":
        action = "keepForReview"

    if action == "chooseLocal" and conflict.conflict_class == "editableDemographicDraft":
        record = await session.get(SyncRecord, (conflict.entity_type, conflict.entity_id))
        if record is not None:
            record.payload = conflict.client_payload
            record.server_version = record.server_version + 1
            record.updated_by_account_id = account.account_id
            await session.flush()
            await _append_change(
                session,
                record=record,
                operation="upsert",
                actor_account_id=account.account_id,
            )

    # chooseServer / keepForReview: server snapshot remains; conflict closed for tracking.
    conflict.status = "resolved"
    conflict.resolution = action
    conflict.resolved_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(conflict)
    return conflict
