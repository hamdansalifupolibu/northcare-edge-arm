from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from httpx import AsyncClient

from northcare_api.security.hashing import request_hash


def envelope_hash(op: dict[str, Any]) -> str:
    return request_hash(
        {
            "operationId": op["operationId"],
            "entityType": op["entityType"],
            "entityId": op["entityId"],
            "operation": op["operation"],
            "baseServerVersion": op["baseServerVersion"],
            "clientLocalVersion": op["clientLocalVersion"],
            "payload": op["payload"],
            "occurredAt": op["occurredAt"],
        }
    )


def client_payload(**overrides: Any) -> dict[str, Any]:
    base = {
        "givenName": "Synthetic",
        "familyName": "Client",
        "organisationId": "org-dev-001",
        "facilityId": "fac-dev-001",
    }
    base.update(overrides)
    return base


def make_op(
    *,
    entity_type: str = "client",
    entity_id: str | None = None,
    operation: str = "create",
    base_server_version: int | None = None,
    client_local_version: int = 1,
    payload: dict[str, Any] | None = None,
    operation_id: str | None = None,
) -> dict[str, Any]:
    op: dict[str, Any] = {
        "operationId": operation_id or str(uuid.uuid4()),
        "entityType": entity_type,
        "entityId": entity_id or str(uuid.uuid4()),
        "operation": operation,
        "baseServerVersion": base_server_version,
        "clientLocalVersion": client_local_version,
        "payload": payload if payload is not None else client_payload(),
        "occurredAt": datetime.now(UTC).isoformat(),
        "requestHash": "",
    }
    op["requestHash"] = envelope_hash(op)
    return op


async def issue_token(
    client: AsyncClient,
    account_id: str = "dev-worker-001",
    password: str = "WorkerDemo1!",
) -> str:
    resp = await client.post(
        "/v1/development/auth/token",
        json={"account_id": account_id, "password": password},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


async def auth_headers(
    client: AsyncClient,
    account_id: str = "dev-worker-001",
    password: str = "WorkerDemo1!",
) -> dict[str, str]:
    token = await issue_token(client, account_id, password)
    return {"Authorization": f"Bearer {token}"}


async def register_device(client: AsyncClient, headers: dict[str, str]) -> str:
    device_id = str(uuid.uuid4())
    resp = await client.post(
        "/v1/devices/register",
        headers=headers,
        json={"device_id": device_id, "user_agent": "pytest"},
    )
    assert resp.status_code == 200, resp.text
    return device_id


async def push(
    client: AsyncClient,
    headers: dict[str, str],
    device_id: str,
    operations: list[dict[str, Any]],
) -> Any:
    return await client.post(
        "/v1/sync/push",
        headers=headers,
        json={"protocolVersion": 1, "deviceId": device_id, "operations": operations},
    )
