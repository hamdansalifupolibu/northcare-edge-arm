from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from tests.helpers import auth_headers, client_payload, make_op, push, register_device


@pytest.mark.asyncio
async def test_update_update_stale_base_version(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    version = created.json()["results"][0]["serverVersion"]
    update = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=2,
        payload=client_payload(familyName="One"),
    )
    await push(api_client, headers, device_id, [update])
    stale = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=3,
        payload=client_payload(familyName="Two"),
    )
    conflict = await push(api_client, headers, device_id, [stale])
    assert conflict.json()["results"][0]["status"] == "conflict"
    assert conflict.json()["results"][0]["errorCode"] == "STALE_BASE_VERSION"


@pytest.mark.asyncio
async def test_update_delete_conflict(api_client: AsyncClient) -> None:
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
    stale_update = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=3,
        payload=client_payload(familyName="AfterDelete"),
    )
    conflict = await push(api_client, headers, device_id, [stale_update])
    assert conflict.json()["results"][0]["status"] == "conflict"


@pytest.mark.asyncio
async def test_delete_update_conflict(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    create = make_op(entity_id=entity_id)
    created = await push(api_client, headers, device_id, [create])
    version = created.json()["results"][0]["serverVersion"]
    update = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=version,
        client_local_version=2,
        payload=client_payload(familyName="Newer"),
    )
    await push(api_client, headers, device_id, [update])
    stale_delete = make_op(
        entity_id=entity_id,
        operation="delete",
        base_server_version=version,
        client_local_version=3,
    )
    conflict = await push(api_client, headers, device_id, [stale_delete])
    assert conflict.json()["results"][0]["status"] == "conflict"


@pytest.mark.asyncio
async def test_create_existing_conflict(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    await push(api_client, headers, device_id, [make_op(entity_id=entity_id)])
    again = make_op(entity_id=entity_id, operation="create")
    conflict = await push(api_client, headers, device_id, [again])
    assert conflict.json()["results"][0]["status"] == "conflict"


@pytest.mark.asyncio
async def test_resolve_choose_server(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    created = await push(api_client, headers, device_id, [make_op(entity_id=entity_id)])
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
    assert resolved.json()["resolution"] == "chooseServer"
    listing = await api_client.get("/v1/sync/conflicts", headers=headers)
    open_ids = {c["conflictId"] for c in listing.json()["conflicts"]}
    assert conflict_id not in open_ids


@pytest.mark.asyncio
async def test_resolve_keep_for_review(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    await push(api_client, headers, device_id, [make_op(entity_id=entity_id)])
    stale = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=0,
        client_local_version=2,
        payload=client_payload(familyName="Review"),
    )
    conflict = await push(api_client, headers, device_id, [stale])
    conflict_id = conflict.json()["results"][0]["conflictId"]
    resolved = await api_client.post(
        f"/v1/sync/conflicts/{conflict_id}/resolve",
        headers=headers,
        json={"action": "keepForReview"},
    )
    assert resolved.status_code == 200
    assert resolved.json()["resolution"] == "keepForReview"
