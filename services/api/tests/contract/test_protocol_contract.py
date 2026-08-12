from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[4]
PROTOCOL = json.loads((ROOT / "implementation" / "sync-protocol-v1.json").read_text(encoding="utf-8"))
REGISTRY = json.loads(
    (ROOT / "implementation" / "sync-entity-registry.json").read_text(encoding="utf-8")
)
ERRORS = json.loads(
    (ROOT / "implementation" / "sync-error-catalogue.json").read_text(encoding="utf-8")
)


def test_protocol_files_exist_and_version_one() -> None:
    assert PROTOCOL["protocolVersion"] == 1
    assert REGISTRY["protocolVersion"] == 1
    assert ERRORS["protocolVersion"] == 1
    assert "push" in PROTOCOL["endpoints"]
    assert "pull" in PROTOCOL["endpoints"]
    assert "client" in {e["entityType"] for e in REGISTRY["entities"]}


def test_operation_types_in_push_request() -> None:
    sample = PROTOCOL["pushRequest"]["operations"][0]["operation"]
    assert "create" in sample
    assert "update" in sample
    assert "delete" in sample
    assert set(PROTOCOL["pushResultStatus"]) == {"acked", "duplicate", "conflict", "rejected"}


def test_error_catalogue_includes_critical_codes() -> None:
    codes = {e["code"] for e in ERRORS["errors"]}
    for required in (
        "IDEMPOTENCY_PAYLOAD_MISMATCH",
        "SCOPE_VIOLATION",
        "STALE_BASE_VERSION",
        "CURSOR_INVALID",
        "AUTH_REQUIRED",
        "AUTH_UNAVAILABLE",
        "DEVICE_NOT_REGISTERED",
    ):
        assert required in codes


def test_entity_registry_conflict_classes_present() -> None:
    for entity in REGISTRY["entities"]:
        assert entity["entityType"]
        assert entity["conflictClass"]
        assert "syncEnabled" in entity


def test_retryable_flags_present() -> None:
    for error in ERRORS["errors"]:
        assert "retryable" in error
        assert isinstance(error["retryable"], bool)


def test_contract_drift_detects_protocol_version_change(tmp_path: Path) -> None:
    mutated = dict(PROTOCOL)
    mutated["protocolVersion"] = 999
    path = tmp_path / "sync-protocol-v1.json"
    path.write_text(json.dumps(mutated), encoding="utf-8")
    loaded = json.loads(path.read_text(encoding="utf-8"))
    with pytest.raises(AssertionError):
        assert loaded["protocolVersion"] == 1


def test_openapi_artifact_contains_sync_paths() -> None:
    openapi = json.loads((ROOT / "implementation" / "openapi.json").read_text(encoding="utf-8"))
    paths = openapi.get("paths", {})
    assert "/health/live" in paths
    assert "/health/ready" in paths
    assert "/v1/sync/push" in paths
    assert "/v1/sync/changes" in paths
    assert "/v1/devices/register" in paths


def test_openapi_artifact_contains_admin_paths() -> None:
    openapi = json.loads((ROOT / "implementation" / "openapi.json").read_text(encoding="utf-8"))
    paths = openapi.get("paths", {})
    for required in (
        "/v1/auth/session",
        "/v1/auth/change-password",
        "/v1/admin/home",
        "/v1/admin/accounts",
        "/v1/admin/accounts/{account_id}",
        "/v1/admin/accounts/{account_id}/facility",
        "/v1/admin/accounts/{account_id}/deactivate",
        "/v1/admin/accounts/{account_id}/reactivate",
        "/v1/admin/accounts/{account_id}/reset-access",
        "/v1/admin/accounts/{account_id}/devices",
        "/v1/admin/accounts/{account_id}/devices/{device_id}/revoke",
        "/v1/admin/accounts/{account_id}/history",
        "/v1/admin/facilities",
        "/v1/admin/professions",
        "/v1/admin/accounts/{account_id}/professional-profile",
    ):
        assert required in paths, required
    # Ensure OpenAPI examples do not embed password verifier fields.
    dumped = json.dumps(openapi)
    assert "password_hash" not in dumped
    assert "passwordHash" not in dumped


def test_openapi_artifact_contains_reach_r2_paths() -> None:
    openapi = json.loads((ROOT / "implementation" / "openapi.json").read_text(encoding="utf-8"))
    paths = openapi.get("paths", {})
    for required in (
        "/v1/reach/requests",
        "/v1/reach/requests/status",
        "/v1/worker/community-requests",
        "/v1/worker/community-requests/{request_id}",
        "/v1/worker/community-requests/{request_id}/acknowledge",
        "/v1/worker/community-requests/{request_id}/contact-attempt",
        "/v1/worker/community-requests/{request_id}/escalate",
        "/v1/worker/community-requests/{request_id}/handle",
        "/reach-simulator",
        "/reach-simulator/{asset_name}",
    ):
        assert required in paths, required
    dumped = json.dumps(openapi)
    assert "status_pin_hash" not in dumped
    assert "statusPinHash" not in dumped
