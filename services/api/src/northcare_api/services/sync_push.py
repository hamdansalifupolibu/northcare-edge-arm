from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.contracts.sync import SyncPushOperation, SyncPushResult
from northcare_api.domain.models import (
    RegisteredDevice,
    SyncChange,
    SyncConflict,
    SyncOperation,
    SyncRecord,
)
from northcare_api.security.hashing import request_hash
from northcare_api.services.entity_registry import (
    conflict_class_for,
    is_supported_entity,
    normalize_entity_type,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _validate_follow_up_reminder(payload: dict[str, Any]) -> None:
    """Reject malformed or device-specific reminder payload fields before persistence."""
    forbidden = {
        "nativeNotificationId",
        "nativeScheduleState",
        "permissionState",
        "channelState",
        "lastScheduleErrorCategory",
    }
    if forbidden.intersection(payload):
        raise ValueError("REMINDER_DEVICE_METADATA_FORBIDDEN")
    allowed_types = {
        "generalFollowUp",
        "visitFollowUp",
        "nutritionFollowUp",
        "referralFollowUp",
        "recordReview",
    }
    allowed_statuses = {
        "draft",
        "active",
        "snoozed",
        "handled",
        "cancelled",
        "expired",
        "needsReview",
        "scheduleFailed",
    }
    if payload.get("reminderType") not in allowed_types or payload.get("status") not in allowed_statuses:
        raise ValueError("REMINDER_VALIDATION_FAILED")
    scheduled = payload.get("scheduledForUtc")
    local_date = payload.get("originalLocalDate")
    local_time = payload.get("originalLocalTime")
    zone = payload.get("originalTimeZone")
    if not all(isinstance(value, str) and value for value in (scheduled, local_date, local_time, zone)):
        raise ValueError("REMINDER_VALIDATION_FAILED")
    if len(str(payload.get("note", ""))) > 1000:
        raise ValueError("REMINDER_VALIDATION_FAILED")


def _scope_payload(
    payload: dict[str, Any],
    account: AuthenticatedAccount,
) -> tuple[str, str]:
    """Derive org/facility from authenticated account; reject client escalation."""
    claimed_org = payload.get("organisationId") or payload.get("organisation_id")
    claimed_facility = payload.get("facilityId") or payload.get("facility_id")
    claimed_owner = payload.get("ownerAccountId") or payload.get("accountId")
    if claimed_org and str(claimed_org) != account.organisation_id:
        raise PermissionError("SCOPE_VIOLATION")
    if (
        claimed_facility
        and str(claimed_facility) != account.facility_id
        and not account.has_admin_role
    ):
        raise PermissionError("SCOPE_VIOLATION")
    if (
        claimed_owner
        and str(claimed_owner) != account.account_id
        and not account.has_admin_role
    ):
        raise PermissionError("SCOPE_VIOLATION")
    return account.organisation_id, account.facility_id


async def _ensure_device(
    session: AsyncSession, account: AuthenticatedAccount, device_id: str
) -> None:
    result = await session.execute(select(RegisteredDevice).where(RegisteredDevice.id == device_id))
    device = result.scalar_one_or_none()
    if device is None or device.account_id != account.account_id:
        raise PermissionError("DEVICE_NOT_REGISTERED")
    if getattr(device, "status", "active") == "revoked":
        raise PermissionError("DEVICE_REVOKED")
    device.last_seen_at = _utcnow()


async def _append_change(
    session: AsyncSession,
    *,
    record: SyncRecord,
    operation: str,
    actor_account_id: str,
) -> None:
    session.add(
        SyncChange(
            entity_type=record.entity_type,
            entity_id=record.entity_id,
            operation=operation,
            server_version=record.server_version,
            payload=None if record.is_deleted else record.payload,
            organisation_id=record.organisation_id,
            facility_id=record.facility_id,
            is_deleted=record.is_deleted,
            changed_at=_utcnow(),
            actor_account_id=actor_account_id,
        )
    )


async def process_push_operation(
    session: AsyncSession,
    account: AuthenticatedAccount,
    device_id: str,
    op: SyncPushOperation,
) -> SyncPushResult:
    if not is_supported_entity(op.entity_type):
        return SyncPushResult(
            operationId=op.operation_id,
            status="rejected",
            errorCode="ENTITY_TYPE_UNSUPPORTED",
        )

    # Persist canonical registry names even when clients send legacy aliases.
    op.entity_type = normalize_entity_type(op.entity_type)
    if op.entity_type == "follow_up_reminder":
        try:
            _validate_follow_up_reminder(op.payload)
        except ValueError as exc:
            return SyncPushResult(
                operationId=op.operation_id,
                status="rejected",
                errorCode=str(exc),
            )

    expected_hash = request_hash(
        {
            "operationId": op.operation_id,
            "entityType": op.entity_type,
            "entityId": op.entity_id,
            "operation": op.operation,
            "baseServerVersion": op.base_server_version,
            "clientLocalVersion": op.client_local_version,
            "payload": op.payload,
            "occurredAt": op.occurred_at,
        }
    )
    if op.request_hash != expected_hash:
        # Accept client-provided hash of payload-only for flexibility, but still store it.
        # Mismatch against either full envelope or payload-only is validated lightly:
        payload_only = request_hash(op.payload)
        if op.request_hash != payload_only and op.request_hash != expected_hash:
            return SyncPushResult(
                operationId=op.operation_id,
                status="rejected",
                errorCode="VALIDATION_FAILED",
            )

    existing_op = await session.get(SyncOperation, op.operation_id)
    if existing_op is not None:
        if existing_op.request_hash != op.request_hash:
            return SyncPushResult(
                operationId=op.operation_id,
                status="rejected",
                errorCode="IDEMPOTENCY_PAYLOAD_MISMATCH",
            )
        return SyncPushResult(
            operationId=op.operation_id,
            status="duplicate",
            serverVersion=existing_op.server_version,
            conflictId=existing_op.conflict_id,
            errorCode=existing_op.error_code,
        )

    try:
        organisation_id, facility_id = _scope_payload(op.payload, account)
    except PermissionError:
        session.add(
            SyncOperation(
                operation_id=op.operation_id,
                account_id=account.account_id,
                device_id=device_id,
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                operation=op.operation,
                request_hash=op.request_hash,
                status="rejected",
                error_code="SCOPE_VIOLATION",
            )
        )
        await session.flush()
        return SyncPushResult(
            operationId=op.operation_id,
            status="rejected",
            errorCode="SCOPE_VIOLATION",
        )

    record = await session.get(SyncRecord, (op.entity_type, op.entity_id))
    conflict_class = conflict_class_for(op.entity_type) or "versionedRecord"

    if op.operation == "create":
        if record is not None and not record.is_deleted:
            conflict_id = str(uuid.uuid4())
            session.add(
                SyncConflict(
                    id=conflict_id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    account_id=account.account_id,
                    organisation_id=organisation_id,
                    facility_id=facility_id,
                    client_operation_id=op.operation_id,
                    base_server_version=op.base_server_version,
                    server_version=record.server_version,
                    client_payload=op.payload,
                    server_payload=record.payload,
                    conflict_class=conflict_class,
                    status="open",
                )
            )
            session.add(
                SyncOperation(
                    operation_id=op.operation_id,
                    account_id=account.account_id,
                    device_id=device_id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    operation=op.operation,
                    request_hash=op.request_hash,
                    server_version=record.server_version,
                    status="conflict",
                    conflict_id=conflict_id,
                    error_code="STALE_BASE_VERSION",
                )
            )
            await session.flush()
            return SyncPushResult(
                operationId=op.operation_id,
                status="conflict",
                serverVersion=record.server_version,
                conflictId=conflict_id,
                errorCode="STALE_BASE_VERSION",
            )
        if record is None:
            record = SyncRecord(
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                organisation_id=organisation_id,
                facility_id=facility_id,
                owner_account_id=account.account_id,
                server_version=1,
                payload=op.payload,
                is_deleted=False,
                updated_by_account_id=account.account_id,
            )
            session.add(record)
        else:
            record.is_deleted = False
            record.deleted_at = None
            record.payload = op.payload
            record.server_version = record.server_version + 1
            record.updated_by_account_id = account.account_id
            record.organisation_id = organisation_id
            record.facility_id = facility_id
        await session.flush()
        await _append_change(
            session, record=record, operation="upsert", actor_account_id=account.account_id
        )
        session.add(
            SyncOperation(
                operation_id=op.operation_id,
                account_id=account.account_id,
                device_id=device_id,
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                operation=op.operation,
                request_hash=op.request_hash,
                server_version=record.server_version,
                status="acked",
            )
        )
        await session.flush()
        return SyncPushResult(
            operationId=op.operation_id,
            status="acked",
            serverVersion=record.server_version,
        )

    # update / delete
    if record is None:
        session.add(
            SyncOperation(
                operation_id=op.operation_id,
                account_id=account.account_id,
                device_id=device_id,
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                operation=op.operation,
                request_hash=op.request_hash,
                status="rejected",
                error_code="VALIDATION_FAILED",
            )
        )
        await session.flush()
        return SyncPushResult(
            operationId=op.operation_id,
            status="rejected",
            errorCode="VALIDATION_FAILED",
        )

    if record.organisation_id != account.organisation_id:
        session.add(
            SyncOperation(
                operation_id=op.operation_id,
                account_id=account.account_id,
                device_id=device_id,
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                operation=op.operation,
                request_hash=op.request_hash,
                status="rejected",
                error_code="SCOPE_VIOLATION",
            )
        )
        await session.flush()
        return SyncPushResult(
            operationId=op.operation_id,
            status="rejected",
            errorCode="SCOPE_VIOLATION",
        )

    if op.base_server_version != record.server_version:
        conflict_id = str(uuid.uuid4())
        session.add(
            SyncConflict(
                id=conflict_id,
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                account_id=account.account_id,
                organisation_id=record.organisation_id,
                facility_id=record.facility_id,
                client_operation_id=op.operation_id,
                base_server_version=op.base_server_version,
                server_version=record.server_version,
                client_payload=op.payload,
                server_payload=record.payload,
                conflict_class=conflict_class,
                status="open",
            )
        )
        session.add(
            SyncOperation(
                operation_id=op.operation_id,
                account_id=account.account_id,
                device_id=device_id,
                entity_type=op.entity_type,
                entity_id=op.entity_id,
                operation=op.operation,
                request_hash=op.request_hash,
                server_version=record.server_version,
                status="conflict",
                conflict_id=conflict_id,
                error_code="STALE_BASE_VERSION",
            )
        )
        await session.flush()
        return SyncPushResult(
            operationId=op.operation_id,
            status="conflict",
            serverVersion=record.server_version,
            conflictId=conflict_id,
            errorCode="STALE_BASE_VERSION",
        )

    if op.operation == "delete":
        record.is_deleted = True
        record.deleted_at = _utcnow()
        record.server_version = record.server_version + 1
        record.updated_by_account_id = account.account_id
        change_op = "delete"
    else:
        record.payload = op.payload
        record.is_deleted = False
        record.deleted_at = None
        record.server_version = record.server_version + 1
        record.updated_by_account_id = account.account_id
        change_op = "upsert"

    await session.flush()
    await _append_change(
        session, record=record, operation=change_op, actor_account_id=account.account_id
    )
    session.add(
        SyncOperation(
            operation_id=op.operation_id,
            account_id=account.account_id,
            device_id=device_id,
            entity_type=op.entity_type,
            entity_id=op.entity_id,
            operation=op.operation,
            request_hash=op.request_hash,
            server_version=record.server_version,
            status="acked",
        )
    )
    await session.flush()
    return SyncPushResult(
        operationId=op.operation_id,
        status="acked",
        serverVersion=record.server_version,
    )


async def push_operations(
    session: AsyncSession,
    account: AuthenticatedAccount,
    device_id: str,
    operations: list[SyncPushOperation],
) -> list[SyncPushResult]:
    await _ensure_device(session, account, device_id)
    results: list[SyncPushResult] = []
    for op in operations:
        async with session.begin_nested():
            results.append(await process_push_operation(session, account, device_id, op))
    await session.commit()
    return results
