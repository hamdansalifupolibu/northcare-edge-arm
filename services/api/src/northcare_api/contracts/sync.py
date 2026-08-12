from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class DevelopmentTokenRequest(BaseModel):
    identifier: str | None = Field(default=None, min_length=1, max_length=320)
    email: str | None = Field(default=None, min_length=3, max_length=320)
    account_id: str | None = Field(default=None, min_length=1, max_length=64)
    password: str = Field(min_length=1)


class DevelopmentTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    account_id: str
    role: str
    roles: list[str] = Field(default_factory=list)
    permitted_workspaces: list[str] = Field(default_factory=list)
    facility_id: str
    organisation_id: str | None = None
    account_status: str | None = None
    first_login_required: bool = False
    display_name: str | None = None
    account_version: int | None = None


class DeviceRegisterRequest(CamelModel):
    device_id: str = Field(alias="deviceId", min_length=8, max_length=64)
    user_agent: str | None = Field(default=None, alias="userAgent")


class DeviceRegisterResponse(CamelModel):
    device_id: str = Field(alias="deviceId")
    registered: bool


class SyncPushOperation(CamelModel):
    operation_id: str = Field(alias="operationId")
    entity_type: str = Field(alias="entityType")
    entity_id: str = Field(alias="entityId")
    operation: Literal["create", "update", "delete"]
    base_server_version: int | None = Field(default=None, alias="baseServerVersion")
    client_local_version: int = Field(alias="clientLocalVersion", ge=1)
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: str = Field(alias="occurredAt")
    request_hash: str = Field(alias="requestHash")


class SyncPushRequest(CamelModel):
    protocol_version: int = Field(alias="protocolVersion")
    device_id: str = Field(alias="deviceId")
    operations: list[SyncPushOperation]


class SyncPushResult(CamelModel):
    operation_id: str = Field(alias="operationId")
    status: Literal["acked", "duplicate", "conflict", "rejected"]
    server_version: int | None = Field(default=None, alias="serverVersion")
    conflict_id: str | None = Field(default=None, alias="conflictId")
    error_code: str | None = Field(default=None, alias="errorCode")


class SyncPushResponse(CamelModel):
    protocol_version: int = Field(alias="protocolVersion")
    results: list[SyncPushResult]


class SyncChangeItem(CamelModel):
    change_id: str = Field(alias="changeId")
    entity_type: str = Field(alias="entityType")
    entity_id: str = Field(alias="entityId")
    operation: Literal["upsert", "delete"]
    server_version: int = Field(alias="serverVersion")
    payload: dict[str, Any] | None = None
    deleted: bool
    changed_at: str = Field(alias="changedAt")


class SyncPullResponse(CamelModel):
    protocol_version: int = Field(alias="protocolVersion")
    changes: list[SyncChangeItem]
    next_cursor: str | None = Field(default=None, alias="nextCursor")
    has_more: bool = Field(alias="hasMore")


class ConflictItem(CamelModel):
    conflict_id: str = Field(alias="conflictId")
    entity_type: str = Field(alias="entityType")
    entity_id: str = Field(alias="entityId")
    conflict_class: str = Field(alias="conflictClass")
    status: str
    base_server_version: int | None = Field(default=None, alias="baseServerVersion")
    server_version: int = Field(alias="serverVersion")
    created_at: str = Field(alias="createdAt")


class ConflictListResponse(BaseModel):
    conflicts: list[ConflictItem]


class ConflictResolveRequest(BaseModel):
    action: Literal["chooseServer", "chooseLocal", "keepForReview"]
    note: str | None = None


class ConflictResolveResponse(CamelModel):
    conflict_id: str = Field(alias="conflictId")
    status: str
    resolution: str
