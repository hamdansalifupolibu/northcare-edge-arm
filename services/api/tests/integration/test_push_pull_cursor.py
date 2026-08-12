from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from northcare_api.config import get_settings
from northcare_api.security.cursors import CursorCodec, SyncCursor
from tests.helpers import (
    auth_headers,
    client_payload,
    make_op,
    push,
    register_device,
)


@pytest.mark.asyncio
async def test_valid_create_update_delete(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    assert created.json()["results"][0]["status"] == "acked"
    version = created.json()["results"][0]["serverVersion"]
    update = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=2,
        payload=client_payload(familyName="Updated"),
    )
    updated = await push(api_client, headers, device_id, [update])
    assert updated.json()["results"][0]["status"] == "acked"
    version2 = updated.json()["results"][0]["serverVersion"]
    delete = make_op(
        entity_id=entity_id,
        operation="delete",
        base_server_version=version2,
        client_local_version=3,
    )
    deleted = await push(api_client, headers, device_id, [delete])
    assert deleted.json()["results"][0]["status"] == "acked"


@pytest.mark.asyncio
async def test_mixed_result_batch_independent_ops(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    good = make_op()
    bad = make_op(entity_type="totally_unsupported")
    resp = await push(api_client, headers, device_id, [bad, good])
    results = resp.json()["results"]
    assert results[0]["status"] == "rejected"
    assert results[1]["status"] == "acked"


@pytest.mark.asyncio
async def test_invalid_payload_hash_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op()
    op["requestHash"] = "0" * 64
    resp = await push(api_client, headers, device_id, [op])
    assert resp.json()["results"][0]["status"] == "rejected"
    assert resp.json()["results"][0]["errorCode"] == "VALIDATION_FAILED"


@pytest.mark.asyncio
async def test_stale_base_version_conflict(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    await push(api_client, headers, device_id, [create])
    stale = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=0,
        client_local_version=2,
        payload=client_payload(familyName="Stale"),
    )
    resp = await push(api_client, headers, device_id, [stale])
    assert resp.json()["results"][0]["status"] == "conflict"


@pytest.mark.asyncio
async def test_forbidden_scope_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    op = make_op(payload=client_payload(organisationId="org-evil"))
    resp = await push(api_client, headers, device_id, [op])
    assert resp.json()["results"][0]["errorCode"] == "SCOPE_VIOLATION"


@pytest.mark.asyncio
async def test_empty_pull(api_client: AsyncClient) -> None:
    # Fresh cursor far ahead: encode max sequence so page is empty for this worker scope.
    headers = await auth_headers(api_client)
    settings = get_settings()
    codec = CursorCodec(settings.cursor_signing_secret)
    cursor = codec.encode(
        SyncCursor(
            sequence=10**12,
            account_id="dev-worker-001",
            organisation_id="org-dev-001",
            facility_id="fac-dev-001",
            role="worker",
        )
    )
    resp = await api_client.get(
        "/v1/sync/changes",
        headers=headers,
        params={"cursor": cursor, "limit": 10},
    )
    assert resp.status_code == 200
    assert resp.json()["changes"] == []
    assert resp.json()["hasMore"] is False


@pytest.mark.asyncio
async def test_stable_ordering_no_duplicate_no_skip(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_ids = [str(uuid.uuid4()) for _ in range(4)]
    for entity_id in entity_ids:
        await push(api_client, headers, device_id, [make_op(entity_id=entity_id)])
    full = await api_client.get(
        "/v1/sync/changes", headers=headers, params={"limit": 500}
    )
    assert full.status_code == 200, full.text
    target = [c for c in full.json()["changes"] if c["entityId"] in entity_ids]
    ids = [c["changeId"] for c in target]
    assert len(ids) == len(set(ids))
    assert ids == sorted(ids, key=int)

    paged: list[str] = []
    cursor = None
    while True:
        params: dict[str, object] = {"limit": 2}
        if cursor:
            params["cursor"] = cursor
        page = await api_client.get("/v1/sync/changes", headers=headers, params=params)
        body = page.json()
        for change in body["changes"]:
            if change["entityId"] in entity_ids:
                paged.append(change["changeId"])
        if not body["hasMore"]:
            break
        cursor = body["nextCursor"]
    assert paged == ids


@pytest.mark.asyncio
async def test_tampered_cursor_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    resp = await api_client.get(
        "/v1/sync/changes",
        headers=headers,
        params={"cursor": "not-a-valid-cursor"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "CURSOR_INVALID"


@pytest.mark.asyncio
async def test_cursor_wrong_scope_rejected(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    settings = get_settings()
    codec = CursorCodec(settings.cursor_signing_secret)
    foreign = codec.encode(
        SyncCursor(
            sequence=0,
            account_id="other-account",
            organisation_id="org-dev-001",
            facility_id="fac-dev-001",
            role="worker",
        )
    )
    resp = await api_client.get(
        "/v1/sync/changes",
        headers=headers,
        params={"cursor": foreign},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "CURSOR_INVALID"


@pytest.mark.asyncio
async def test_cursor_does_not_grant_access_alone(api_client: AsyncClient) -> None:
    settings = get_settings()
    codec = CursorCodec(settings.cursor_signing_secret)
    cursor = codec.encode(
        SyncCursor(
            sequence=0,
            account_id="dev-worker-001",
            organisation_id="org-dev-001",
            facility_id="fac-dev-001",
            role="worker",
        )
    )
    resp = await api_client.get("/v1/sync/changes", params={"cursor": cursor})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_response_limit_enforced(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    resp = await api_client.get(
        "/v1/sync/changes",
        headers=headers,
        params={"limit": 1000},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_tombstone_delivery(api_client: AsyncClient) -> None:
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
    )
    await push(api_client, headers, device_id, [delete])
    pull = await api_client.get(
        "/v1/sync/changes", headers=headers, params={"limit": 500}
    )
    matches = [c for c in pull.json()["changes"] if c["entityId"] == entity_id]
    assert any(c["deleted"] or c["operation"] == "delete" for c in matches)


@pytest.mark.asyncio
async def test_previous_cursor_replay_stable(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    for _ in range(2):
        await push(api_client, headers, device_id, [make_op()])
    first = await api_client.get(
        "/v1/sync/changes", headers=headers, params={"limit": 1}
    )
    assert first.status_code == 200, first.text
    cursor = first.json()["nextCursor"]
    a = await api_client.get(
        "/v1/sync/changes", headers=headers, params={"limit": 1, "cursor": cursor}
    )
    b = await api_client.get(
        "/v1/sync/changes", headers=headers, params={"limit": 1, "cursor": cursor}
    )
    assert a.status_code == 200, a.text
    assert b.status_code == 200, b.text
    assert a.json()["changes"] == b.json()["changes"]
