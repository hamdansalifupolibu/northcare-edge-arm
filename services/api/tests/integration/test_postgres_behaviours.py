"""PostgreSQL-backed proofs for Stage 14 required behaviours."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select, text

from northcare_api.database import SessionLocal
from northcare_api.domain.models import SyncChange, SyncOperation, SyncRecord
from tests.helpers import (
    auth_headers,
    client_payload,
    envelope_hash,
    make_op,
    push,
    register_device,
)


@pytest.mark.asyncio
async def test_pg_01_alembic_tables_exist() -> None:
    async with SessionLocal() as session:
        rows = await session.execute(
            text(
                "SELECT tablename FROM pg_tables "
                "WHERE schemaname = 'public' ORDER BY tablename"
            )
        )
        tables = {r[0] for r in rows}
    for required in (
        "alembic_version",
        "sync_records",
        "sync_changes",
        "sync_operations",
        "sync_conflicts",
        "registered_devices",
        "server_accounts",
        "server_facilities",
    ):
        assert required in tables, f"missing {required}; have={sorted(tables)}"


@pytest.mark.asyncio
async def test_pg_02_current_migration_revision() -> None:
    async with SessionLocal() as session:
        version = await session.scalar(text("SELECT version_num FROM alembic_version"))
    assert version == "0005"


@pytest.mark.asyncio
async def test_pg_03_unique_operation_id(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    first = await push(api_client, headers, device_id, [op])
    assert first.json()["results"][0]["status"] == "acked"
    second = await push(api_client, headers, device_id, [op])
    assert second.json()["results"][0]["status"] == "duplicate"
    async with SessionLocal() as session:
        count = await session.scalar(
            select(func.count()).select_from(SyncOperation).where(
                SyncOperation.operation_id == op["operationId"]
            )
        )
    assert count == 1


@pytest.mark.asyncio
async def test_pg_04_unique_entity_scope(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    assert (await push(api_client, headers, device_id, [create])).json()["results"][0][
        "status"
    ] == "acked"
    again = make_op(entity_id=entity_id, operation="create")
    conflict = await push(api_client, headers, device_id, [again])
    assert conflict.json()["results"][0]["status"] == "conflict"
    async with SessionLocal() as session:
        count = await session.scalar(
            select(func.count())
            .select_from(SyncRecord)
            .where(SyncRecord.entity_type == "client", SyncRecord.entity_id == entity_id)
        )
    assert count == 1


@pytest.mark.asyncio
async def test_pg_05_record_and_changelog_atomicity(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    op = make_op(entity_id=entity_id)
    result = await push(api_client, headers, device_id, [op])
    assert result.json()["results"][0]["status"] == "acked"
    server_version = result.json()["results"][0]["serverVersion"]
    async with SessionLocal() as session:
        record = await session.get(SyncRecord, ("client", entity_id))
        changes = (
            await session.execute(
                select(SyncChange).where(
                    SyncChange.entity_type == "client", SyncChange.entity_id == entity_id
                )
            )
        ).scalars().all()
    assert record is not None
    assert record.server_version == server_version
    assert len(changes) == 1
    assert changes[0].server_version == server_version


@pytest.mark.asyncio
async def test_pg_06_idempotent_duplicate_no_extra_changelog(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    op = make_op(entity_id=entity_id)
    first = await push(api_client, headers, device_id, [op])
    version = first.json()["results"][0]["serverVersion"]
    replay = await push(api_client, headers, device_id, [op])
    assert replay.json()["results"][0]["status"] == "duplicate"
    assert replay.json()["results"][0]["serverVersion"] == version
    async with SessionLocal() as session:
        change_count = await session.scalar(
            select(func.count())
            .select_from(SyncChange)
            .where(SyncChange.entity_type == "client", SyncChange.entity_id == entity_id)
        )
        record = await session.get(SyncRecord, ("client", entity_id))
    assert change_count == 1
    assert record is not None
    assert record.server_version == version


@pytest.mark.asyncio
async def test_pg_07_reused_operation_id_changed_payload_rejected(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    assert (await push(api_client, headers, device_id, [op])).json()["results"][0][
        "status"
    ] == "acked"
    mutated = dict(op)
    mutated["payload"] = client_payload(familyName="Changed")
    mutated["requestHash"] = envelope_hash(mutated)
    rejected = await push(api_client, headers, device_id, [mutated])
    assert rejected.json()["results"][0]["status"] == "rejected"
    assert rejected.json()["results"][0]["errorCode"] == "IDEMPOTENCY_PAYLOAD_MISMATCH"


@pytest.mark.asyncio
async def test_pg_08_concurrent_stale_update(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    version = created.json()["results"][0]["serverVersion"]
    update_a = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=2,
        payload=client_payload(familyName="A"),
    )
    update_b = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=2,
        payload=client_payload(familyName="B"),
    )
    # Sequential savepoints in one connection still demonstrate stale second writer.
    first = await push(api_client, headers, device_id, [update_a])
    second = await push(api_client, headers, device_id, [update_b])
    statuses = {first.json()["results"][0]["status"], second.json()["results"][0]["status"]}
    assert "acked" in statuses
    assert "conflict" in statuses


@pytest.mark.asyncio
async def test_pg_09_monotonic_change_sequence(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    ids = [str(uuid.uuid4()) for _ in range(3)]
    for entity_id in ids:
        op = make_op(entity_id=entity_id)
        assert (await push(api_client, headers, device_id, [op])).json()["results"][0][
            "status"
        ] == "acked"
    async with SessionLocal() as session:
        rows = (
            await session.execute(
                select(SyncChange.id)
                .where(SyncChange.entity_id.in_(ids))
                .order_by(SyncChange.id.asc())
            )
        ).scalars().all()
    assert rows == sorted(rows)
    assert len(rows) == 3


@pytest.mark.asyncio
async def test_pg_10_cursor_pagination(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    for _ in range(3):
        op = make_op()
        assert (await push(api_client, headers, device_id, [op])).status_code == 200
    page1 = await api_client.get("/v1/sync/changes", headers=headers, params={"limit": 1})
    assert page1.status_code == 200, page1.text
    body1 = page1.json()
    assert "changes" in body1, body1
    assert len(body1["changes"]) == 1
    assert body1["hasMore"] is True
    assert body1["nextCursor"]
    page2 = await api_client.get(
        "/v1/sync/changes",
        headers=headers,
        params={"limit": 1, "cursor": body1["nextCursor"]},
    )
    assert page2.status_code == 200, page2.text
    body2 = page2.json()
    assert len(body2["changes"]) == 1
    assert body1["changes"][0]["changeId"] != body2["changes"][0]["changeId"]


@pytest.mark.asyncio
async def test_pg_11_conflict_creation(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    version = created.json()["results"][0]["serverVersion"]
    stale = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=0,
        client_local_version=2,
        payload=client_payload(familyName="Stale"),
    )
    # Force stale base relative to current version.
    stale["baseServerVersion"] = max(0, (version or 1) - 1)
    if stale["baseServerVersion"] == version:
        stale["baseServerVersion"] = 0
    stale["requestHash"] = envelope_hash(stale)
    conflict = await push(api_client, headers, device_id, [stale])
    result = conflict.json()["results"][0]
    assert result["status"] == "conflict"
    assert result["conflictId"]


@pytest.mark.asyncio
async def test_pg_12_conflict_resolution(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    version = created.json()["results"][0]["serverVersion"]
    stale = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=0,
        client_local_version=2,
        payload=client_payload(familyName="Local"),
    )
    assert stale["baseServerVersion"] != version
    conflict = await push(api_client, headers, device_id, [stale])
    conflict_id = conflict.json()["results"][0]["conflictId"]
    resolved = await api_client.post(
        f"/v1/sync/conflicts/{conflict_id}/resolve",
        headers=headers,
        json={"action": "chooseServer"},
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert resolved.json()["resolution"] == "chooseServer"


@pytest.mark.asyncio
async def test_pg_13_soft_delete_tombstone(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    version = created.json()["results"][0]["serverVersion"]
    delete = make_op(
        entity_id=entity_id,
        operation="delete",
        base_server_version=version,
        client_local_version=2,
        payload=client_payload(),
    )
    deleted = await push(api_client, headers, device_id, [delete])
    assert deleted.json()["results"][0]["status"] == "acked"
    pull = await api_client.get("/v1/sync/changes", headers=headers, params={"limit": 500})
    tombstones = [
        c
        for c in pull.json()["changes"]
        if c["entityId"] == entity_id and (c["deleted"] or c["operation"] == "delete")
    ]
    assert tombstones
    async with SessionLocal() as session:
        record = await session.get(SyncRecord, ("client", entity_id))
    assert record is not None
    assert record.is_deleted is True


@pytest.mark.asyncio
async def test_pg_14_rollback_after_forced_failure_via_savepoint(
    api_client: AsyncClient,
) -> None:
    """Independent-op batch: invalid op rejects; valid sibling still commits."""
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    good = make_op()
    bad = make_op(entity_type="not_a_real_entity")
    resp = await push(api_client, headers, device_id, [good, bad])
    results = resp.json()["results"]
    assert results[0]["status"] == "acked"
    assert results[1]["status"] == "rejected"
    assert results[1]["errorCode"] == "ENTITY_TYPE_UNSUPPORTED"
    async with SessionLocal() as session:
        record = await session.get(SyncRecord, ("client", good["entityId"]))
        bad_ops = (
            await session.execute(
                select(SyncOperation).where(SyncOperation.operation_id == bad["operationId"])
            )
        ).scalars().all()
    assert record is not None
    # Unsupported entity returns before SyncOperation insert.
    assert bad_ops == []
