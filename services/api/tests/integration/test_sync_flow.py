from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from tests.helpers import auth_headers, client_payload, make_op, push, register_device


@pytest.mark.asyncio
async def test_push_pull_idempotency_and_conflict(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    device_id = await register_device(api_client, headers)
    entity_id = str(uuid.uuid4())
    payload = client_payload(givenName="Ama", familyName="Test")
    op = make_op(entity_id=entity_id, payload=payload)
    created = await push(api_client, headers, device_id, [op])
    assert created.status_code == 200
    assert created.json()["results"][0]["status"] == "acked"

    replay = await push(api_client, headers, device_id, [op])
    assert replay.json()["results"][0]["status"] == "duplicate"

    found = False
    cursor = None
    while True:
        params: dict[str, object] = {"limit": 100}
        if cursor:
            params["cursor"] = cursor
        pull = await api_client.get("/v1/sync/changes", headers=headers, params=params)
        assert pull.status_code == 200, pull.text
        body = pull.json()
        if any(c["entityId"] == entity_id for c in body["changes"]):
            found = True
            break
        if not body["hasMore"]:
            break
        cursor = body["nextCursor"]
    assert found

    stale = make_op(
        entity_id=entity_id,
        operation="update",
        base_server_version=0,
        client_local_version=2,
        payload={**payload, "familyName": "Stale"},
    )
    conflict = await push(api_client, headers, device_id, [stale])
    assert conflict.json()["results"][0]["status"] == "conflict"
