from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class AdminAccountSummary(CamelModel):
    account_id: str = Field(alias="accountId")
    display_name: str = Field(alias="displayName")
    email: str | None = None
    roles: list[str]
    facility_id: str = Field(alias="facilityId")
    facility_name: str = Field(alias="facilityName")
    account_status: str = Field(alias="accountStatus")
    first_login_required: bool = Field(alias="firstLoginRequired")
    last_remote_sign_in_at: str | None = Field(default=None, alias="lastRemoteSignInAt")
    registered_device_count: int = Field(alias="registeredDeviceCount")
    account_version: int = Field(alias="accountVersion")
    updated_at: str = Field(alias="updatedAt")


class AdminAccountListResponse(CamelModel):
    items: list[AdminAccountSummary]
    page: int
    page_size: int = Field(alias="pageSize")
    total: int
    organisation_id: str = Field(alias="organisationId")


class AdminAccountDetails(AdminAccountSummary):
    organisation_id: str = Field(alias="organisationId")
    organisation_name: str = Field(alias="organisationName")
    identity_provider: str = Field(alias="identityProvider")
    created_at: str = Field(alias="createdAt")
    permitted_workspaces: list[str] = Field(alias="permittedWorkspaces")
    professional_profile: ProfessionalProfileResponse | None = Field(
        default=None, alias="professionalProfile"
    )


class ProfessionItem(CamelModel):
    value: str
    label: str
    active: bool
    allows_other_description: bool = Field(alias="allowsOtherDescription")
    display_order: int = Field(alias="displayOrder")


class ProfessionRegistryResponse(CamelModel):
    items: list[ProfessionItem]


class ProfessionalProfileResponse(CamelModel):
    account_id: str = Field(alias="accountId")
    profession: str
    other_profession_description: str | None = Field(
        default=None, alias="otherProfessionDescription"
    )
    community_requests_enabled: bool = Field(alias="communityRequestsEnabled")
    emergency_requests_enabled: bool = Field(alias="emergencyRequestsEnabled")
    version: int
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class ProfessionalProfileUpsertRequest(CamelModel):
    profession: str = Field(min_length=1, max_length=64)
    other_profession_description: str | None = Field(
        default=None, alias="otherProfessionDescription", max_length=120
    )
    community_requests_enabled: bool = Field(alias="communityRequestsEnabled")
    emergency_requests_enabled: bool = Field(alias="emergencyRequestsEnabled")
    expected_profile_version: int | None = Field(
        default=None, alias="expectedProfileVersion", ge=1
    )


class RegisterWorkerRequest(CamelModel):
    display_name: str = Field(alias="displayName", min_length=2, max_length=255)
    email: str = Field(min_length=3, max_length=320)
    facility_id: str = Field(alias="facilityId", min_length=1, max_length=64)
    temporary_password: str = Field(alias="temporaryPassword", min_length=12, max_length=128)
    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=128)
    profession: str = Field(min_length=1, max_length=64)
    other_profession_description: str | None = Field(
        default=None, alias="otherProfessionDescription", max_length=120
    )
    community_requests_enabled: bool = Field(alias="communityRequestsEnabled")
    emergency_requests_enabled: bool = Field(alias="emergencyRequestsEnabled")
    # Client-supplied role/org intentionally ignored if present.
    role: str | None = None
    organisation_id: str | None = Field(default=None, alias="organisationId")


class RegisterWorkerResponse(CamelModel):
    account_id: str = Field(alias="accountId")
    display_name: str = Field(alias="displayName")
    email: str
    roles: list[str]
    facility_id: str = Field(alias="facilityId")
    account_status: str = Field(alias="accountStatus")
    first_login_required: bool = Field(alias="firstLoginRequired")
    account_version: int = Field(alias="accountVersion")
    identity_provider: str = Field(alias="identityProvider")
    professional_profile: ProfessionalProfileResponse = Field(alias="professionalProfile")


class FacilityChangeRequest(CamelModel):
    facility_id: str = Field(alias="facilityId", min_length=1, max_length=64)
    expected_account_version: int = Field(alias="expectedAccountVersion", ge=1)


class AccountVersionMutationRequest(CamelModel):
    expected_account_version: int = Field(alias="expectedAccountVersion", ge=1)


class ResetAccessRequest(CamelModel):
    expected_account_version: int = Field(alias="expectedAccountVersion", ge=1)
    temporary_password: str = Field(alias="temporaryPassword", min_length=12, max_length=128)


class MutationAckResponse(CamelModel):
    account_id: str = Field(alias="accountId")
    account_status: str = Field(alias="accountStatus")
    account_version: int = Field(alias="accountVersion")
    facility_id: str | None = Field(default=None, alias="facilityId")


class AdminDeviceItem(CamelModel):
    device_id: str = Field(alias="deviceId")
    label: str | None = None
    platform: str | None = None
    app_version: str | None = Field(default=None, alias="appVersion")
    status: str
    created_at: str = Field(alias="createdAt")
    last_seen_at: str = Field(alias="lastSeenAt")
    is_current: bool = Field(alias="isCurrent")


class AdminDeviceListResponse(CamelModel):
    items: list[AdminDeviceItem]


class AdminHistoryItem(CamelModel):
    event_id: str = Field(alias="eventId")
    event_type: str = Field(alias="eventType")
    created_at: str = Field(alias="createdAt")
    actor_account_id: str = Field(alias="actorAccountId")
    target_account_id: str | None = Field(default=None, alias="targetAccountId")
    result: str
    reason_category: str | None = Field(default=None, alias="reasonCategory")


class AdminHistoryResponse(CamelModel):
    items: list[AdminHistoryItem]


class AdminFacilityItem(CamelModel):
    facility_id: str = Field(alias="facilityId")
    name: str
    facility_type: str | None = Field(default=None, alias="facilityType")
    district: str | None = None
    region: str | None = None
    is_active: bool = Field(alias="isActive")


class AdminFacilityListResponse(CamelModel):
    items: list[AdminFacilityItem]


class AdminHomeSummaryResponse(CamelModel):
    organisation_id: str = Field(alias="organisationId")
    worker_count: int = Field(alias="workerCount")
    pending_first_login_count: int = Field(alias="pendingFirstLoginCount")
    inactive_worker_count: int = Field(alias="inactiveWorkerCount")
    backend_available: bool = Field(alias="backendAvailable")


class SessionAuthorisationResponse(CamelModel):
    account_id: str = Field(alias="accountId")
    display_name: str = Field(alias="displayName")
    email: str | None = None
    roles: list[str]
    permitted_workspaces: list[str] = Field(alias="permittedWorkspaces")
    account_status: str = Field(alias="accountStatus")
    organisation_id: str = Field(alias="organisationId")
    worker_facility_id: str | None = Field(default=None, alias="workerFacilityId")
    first_login_required: bool = Field(alias="firstLoginRequired")
    account_version: int = Field(alias="accountVersion")
    identity_provider: str = Field(alias="identityProvider")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(alias="currentPassword", min_length=1)
    new_password: str = Field(alias="newPassword", min_length=12, max_length=128)

    model_config = ConfigDict(populate_by_name=True)


class ChangePasswordResponse(CamelModel):
    account_id: str = Field(alias="accountId")
    account_status: str = Field(alias="accountStatus")
    first_login_required: bool = Field(alias="firstLoginRequired")


class ErrorBody(BaseModel):
    code: str
    details: dict[str, Any] | None = None


AdminMutationKind = Literal[
    "register",
    "facility",
    "deactivate",
    "reactivate",
    "resetAccess",
    "revokeDevice",
]
