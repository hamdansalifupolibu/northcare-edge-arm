from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

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
async def test_first_operation_applied(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    resp = await push(api_client, headers, device_id, [op])
    assert resp.json()["results"][0]["status"] == "acked"
    assert resp.json()["results"][0]["serverVersion"] == 1


@pytest.mark.asyncio
async def test_exact_retry_returns_original_ack(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    first = await push(api_client, headers, device_id, [op])
    replay = await push(api_client, headers, device_id, [op])
    assert first.json()["results"][0]["serverVersion"] == replay.json()["results"][0][
        "serverVersion"
    ]
    assert replay.json()["results"][0]["status"] == "duplicate"


@pytest.mark.asyncio
async def test_retry_does_not_create_second_record_or_change(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    op = make_op(entity_id=entity_id)
    await push(api_client, headers, device_id, [op])
    await push(api_client, headers, device_id, [op])
    async with SessionLocal() as session:
        records = await session.scalar(
            select(func.count())
            .select_from(SyncRecord)
            .where(SyncRecord.entity_id == entity_id)
        )
        changes = await session.scalar(
            select(func.count())
            .select_from(SyncChange)
            .where(SyncChange.entity_id == entity_id)
        )
        ops = await session.scalar(
            select(func.count())
            .select_from(SyncOperation)
            .where(SyncOperation.operation_id == op["operationId"])
        )
    assert records == 1
    assert changes == 1
    assert ops == 1


@pytest.mark.asyncio
async def test_retry_does_not_increment_server_version_or_sequence(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    op = make_op(entity_id=entity_id)
    first = await push(api_client, headers, device_id, [op])
    version = first.json()["results"][0]["serverVersion"]
    async with SessionLocal() as session:
        before_max = await session.scalar(select(func.max(SyncChange.id)))
    await push(api_client, headers, device_id, [op])
    async with SessionLocal() as session:
        record = await session.get(SyncRecord, ("client", entity_id))
        after_max = await session.scalar(select(func.max(SyncChange.id)))
    assert record is not None
    assert record.server_version == version
    assert after_max == before_max


@pytest.mark.asyncio
async def test_same_operation_id_different_content_rejected(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    await push(api_client, headers, device_id, [op])
    mutated = dict(op)
    mutated["payload"] = client_payload(givenName="Different")
    mutated["requestHash"] = envelope_hash(mutated)
    resp = await push(api_client, headers, device_id, [mutated])
    assert resp.json()["results"][0]["errorCode"] == "IDEMPOTENCY_PAYLOAD_MISMATCH"


@pytest.mark.asyncio
async def test_same_operation_id_unauthorised_device_rejected(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_a = await register_device(api_client, headers)
    device_b = await register_device(api_client, headers)
    op = make_op()
    await push(api_client, headers, device_a, [op])
    # Exact retry from another registered device of same account is still duplicate
    # (idempotency key is operation_id). Unregistered device is rejected at push gate.
    fake_device = str(uuid.uuid4())
    resp = await push(api_client, headers, fake_device, [op])
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "DEVICE_NOT_REGISTERED"
    # Same account alternate device still gets duplicate semantics (no second apply).
    alt = await push(api_client, headers, device_b, [op])
    assert alt.json()["results"][0]["status"] == "duplicate"


@pytest.mark.asyncio
async def test_timeout_style_retry_remains_safe(api_client: AsyncClient) -> None:
    """Client may retry after unknown outcome; exact envelope remains idempotent."""
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    first = await push(api_client, headers, device_id, [op])
    assert first.status_code == 200
    for _ in range(3):
        replay = await push(api_client, headers, device_id, [op])
        assert replay.json()["results"][0]["status"] == "duplicate"
        assert (
            replay.json()["results"][0]["serverVersion"]
            == first.json()["results"][0]["serverVersion"]
        )


@pytest.mark.asyncio
async def test_idempotency_history_persists_across_sessions(
    api_client: AsyncClient,
) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    await push(api_client, headers, device_id, [op])
    # New ASGI client session still sees SyncOperation row in PostgreSQL.
    from httpx import ASGITransport
    from httpx import AsyncClient as AC

    from northcare_api.main import app

    transport = ASGITransport(app=app)
    async with AC(transport=transport, base_url="http://test") as client2:
        replay = await push(client2, headers, device_id, [op])
    assert replay.json()["results"][0]["status"] == "duplicate"
