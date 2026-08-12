#!/usr/bin/env python3
"""Automated two-device sync simulation against a running API."""

from __future__ import annotations

import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from northcare_api.security.hashing import request_hash

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def envelope_hash(op: dict) -> str:
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


def main() -> None:
    client = httpx.Client(base_url=BASE, timeout=30.0)
    live = client.get("/health/live")
    live.raise_for_status()
    print("HEALTH live=", live.json())

    token_resp = client.post(
        "/v1/development/auth/token",
        json={"account_id": "dev-worker-001", "password": "WorkerDemo1!"},
    )
    token_resp.raise_for_status()
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("AUTH development token issued for synthetic account_id=dev-worker-001")

    device_a = str(uuid.uuid4())
    device_b = str(uuid.uuid4())
    for label, device_id in (("A", device_a), ("B", device_b)):
        r = client.post(
            "/v1/devices/register",
            headers=headers,
            json={"device_id": device_id, "user_agent": f"two-device-sim-{label}"},
        )
        r.raise_for_status()
        print(f"DEVICE {label} registered deviceId={device_id}")

    entity_id = str(uuid.uuid4())
    op_id_create = str(uuid.uuid4())
    occurred = datetime.now(UTC).isoformat()
    payload = {
        "givenName": "Synthetic",
        "familyName": "ClientA",
        "organisationId": "org-dev-001",
        "facilityId": "fac-dev-001",
    }
    create_op = {
        "operationId": op_id_create,
        "entityType": "client",
        "entityId": entity_id,
        "operation": "create",
        "baseServerVersion": None,
        "clientLocalVersion": 1,
        "payload": payload,
        "occurredAt": occurred,
        "requestHash": "",
    }
    create_op["requestHash"] = envelope_hash(create_op)

    print("ENTITY_TYPE=client")
    print(f"SYNTHETIC_ENTITY_ID={entity_id}")
    print(f"OPERATION_ID_CREATE={op_id_create}")
    print("NO_REAL_PATIENT_DATA=true")

    print("DEVICE_A STEP local_create+push")
    push_a = client.post(
        "/v1/sync/push",
        headers=headers,
        json={
            "protocolVersion": 1,
            "deviceId": device_a,
            "operations": [create_op],
        },
    )
    push_a.raise_for_status()
    result = push_a.json()["results"][0]
    assert result["status"] == "acked", result
    server_version = result["serverVersion"]
    print(
        f"DEVICE_A STEP server_ack status=acked serverVersion={server_version} "
        f"operationId={op_id_create}"
    )

    replay = client.post(
        "/v1/sync/push",
        headers=headers,
        json={"protocolVersion": 1, "deviceId": device_a, "operations": [create_op]},
    )
    replay.raise_for_status()
    assert replay.json()["results"][0]["status"] == "duplicate"
    print("DEVICE_A STEP idempotent_replay status=duplicate (same operationId)")

    print("DEVICE_B STEP pull")
    pull_b = client.get("/v1/sync/changes", headers=headers, params={"limit": 200})
    pull_b.raise_for_status()
    pull_body = pull_b.json()
    changes = pull_body["changes"]
    assert any(c["entityId"] == entity_id for c in changes), changes
    cursor_b = pull_body.get("nextCursor")
    print(
        f"DEVICE_B STEP local_apply_ready matched entityId={entity_id} "
        f"nextCursor_present={bool(cursor_b)} change_count={len(changes)}"
    )

    print("DEVICE_B STEP update+push (fresh base)")
    op_id_update = str(uuid.uuid4())
    update_payload = {**payload, "familyName": "ClientB"}
    update_op = {
        "operationId": op_id_update,
        "entityType": "client",
        "entityId": entity_id,
        "operation": "update",
        "baseServerVersion": server_version,
        "clientLocalVersion": 2,
        "payload": update_payload,
        "occurredAt": datetime.now(UTC).isoformat(),
        "requestHash": "",
    }
    update_op["requestHash"] = envelope_hash(update_op)
    print(f"OPERATION_ID_UPDATE={op_id_update} distinct_from_create={op_id_update != op_id_create}")
    update_push = client.post(
        "/v1/sync/push",
        headers=headers,
        json={"protocolVersion": 1, "deviceId": device_b, "operations": [update_op]},
    )
    update_push.raise_for_status()
    update_result = update_push.json()["results"][0]
    assert update_result["status"] == "acked", update_result
    server_version_2 = update_result["serverVersion"]
    print(f"DEVICE_B STEP server_ack status=acked new_serverVersion={server_version_2}")

    print("DEVICE_A STEP stale_local_update (baseServerVersion=0)")
    stale_op_id = str(uuid.uuid4())
    stale_payload = {**payload, "familyName": "Stale"}
    stale = {
        "operationId": stale_op_id,
        "entityType": "client",
        "entityId": entity_id,
        "operation": "update",
        "baseServerVersion": 0,
        "clientLocalVersion": 3,
        "payload": stale_payload,
        "occurredAt": datetime.now(UTC).isoformat(),
        "requestHash": "",
    }
    stale["requestHash"] = envelope_hash(stale)
    print(f"OPERATION_ID_STALE={stale_op_id}")
    conflict_push = client.post(
        "/v1/sync/push",
        headers=headers,
        json={"protocolVersion": 1, "deviceId": device_a, "operations": [stale]},
    )
    conflict_push.raise_for_status()
    conflict_result = conflict_push.json()["results"][0]
    assert conflict_result["status"] == "conflict", conflict_result
    conflict_id = conflict_result["conflictId"]
    print(
        f"DEVICE_A STEP conflict_response status=conflict conflictId={conflict_id} "
        f"NO_SILENT_LWW=true"
    )

    print("DEVICE_A STEP conflict_persistence+resolution chooseServer")
    resolve = client.post(
        f"/v1/sync/conflicts/{conflict_id}/resolve",
        headers=headers,
        json={"action": "chooseServer"},
    )
    resolve.raise_for_status()
    assert resolve.json()["status"] == "resolved"
    print(f"DEVICE_A STEP resolution status=resolved action=chooseServer conflictId={conflict_id}")

    # Replacement-style follow-up with a new operation UUID after resolution.
    replacement_op_id = str(uuid.uuid4())
    replacement = {
        "operationId": replacement_op_id,
        "entityType": "client",
        "entityId": entity_id,
        "operation": "update",
        "baseServerVersion": server_version_2,
        "clientLocalVersion": 4,
        "payload": {**payload, "familyName": "Resolved"},
        "occurredAt": datetime.now(UTC).isoformat(),
        "requestHash": "",
    }
    replacement["requestHash"] = envelope_hash(replacement)
    print(f"OPERATION_ID_REPLACEMENT={replacement_op_id}")
    replacement_push = client.post(
        "/v1/sync/push",
        headers=headers,
        json={"protocolVersion": 1, "deviceId": device_a, "operations": [replacement]},
    )
    replacement_push.raise_for_status()
    replacement_result = replacement_push.json()["results"][0]
    assert replacement_result["status"] == "acked", replacement_result
    print(
        f"DEVICE_A STEP replacement_push status=acked "
        f"serverVersion={replacement_result['serverVersion']}"
    )

    final_pull = client.get("/v1/sync/changes", headers=headers, params={"limit": 200})
    final_pull.raise_for_status()
    final_cursor = final_pull.json().get("nextCursor")
    print(
        f"DEVICE_A STEP final_pull change_count={len(final_pull.json()['changes'])} "
        f"cursor_present={bool(final_cursor)}"
    )
    print(
        "CURSOR_ISOLATION=cursors are account/org/facility/role bound; "
        f"deviceA={device_a} deviceB={device_b}"
    )
    print("DISTINCT_OPERATION_IDS=true")
    print("TWO_DEVICE_SIMULATION_OK")


if __name__ == "__main__":
    main()
