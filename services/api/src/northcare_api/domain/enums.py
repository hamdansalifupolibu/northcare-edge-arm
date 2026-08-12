from __future__ import annotations

from enum import StrEnum


class AccountRole(StrEnum):
    WORKER = "worker"
    ADMIN = "admin"
    # Legacy alias retained for migration compatibility only.
    ADMINISTRATOR = "administrator"


class AccountStatus(StrEnum):
    PENDING_PROVISIONING = "pendingProvisioning"
    PENDING_FIRST_LOGIN = "pendingFirstLogin"
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROVISIONING_FAILED = "provisioningFailed"


class RoleAssignmentStatus(StrEnum):
    ACTIVE = "active"
    REVOKED = "revoked"


class DeviceStatus(StrEnum):
    ACTIVE = "active"
    REVOKED = "revoked"
    RETIRED = "retired"


class WorkspaceId(StrEnum):
    WORKER = "worker"
    ADMINISTRATION = "administration"


class SyncOperationType(StrEnum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class PushResultStatus(StrEnum):
    ACKED = "acked"
    DUPLICATE = "duplicate"
    CONFLICT = "conflict"
    REJECTED = "rejected"


class SyncOpStatus(StrEnum):
    ACKED = "acked"
    DUPLICATE = "duplicate"
    CONFLICT = "conflict"
    REJECTED = "rejected"


class ChangeOperation(StrEnum):
    UPSERT = "upsert"
    DELETE = "delete"


class ConflictStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"


class ConflictClass(StrEnum):
    SERVER_AUTHORITATIVE = "serverAuthoritative"
    APPEND_ONLY = "appendOnly"
    VERSIONED_COMPLETED_CLINICAL = "versionedCompletedClinical"
    EDITABLE_DEMOGRAPHIC_DRAFT = "editableDemographicDraft"
    VERSIONED_RECORD = "versionedRecord"


class ResolutionAction(StrEnum):
    CHOOSE_SERVER = "chooseServer"
    CHOOSE_LOCAL = "chooseLocal"
    KEEP_FOR_REVIEW = "keepForReview"


def canonical_role(role: str) -> str:
    if role in (AccountRole.ADMIN, AccountRole.ADMINISTRATOR, "administrator"):
        return AccountRole.ADMIN
    if role == AccountRole.WORKER:
        return AccountRole.WORKER
    raise ValueError("unsupported_role")


def is_admin_role(role: str) -> bool:
    return role in (AccountRole.ADMIN, AccountRole.ADMINISTRATOR, "administrator")


def has_admin_role(roles: list[str] | tuple[str, ...]) -> bool:
    return any(is_admin_role(role) for role in roles)


def has_worker_role(roles: list[str] | tuple[str, ...]) -> bool:
    return AccountRole.WORKER in roles


def permitted_workspaces(roles: list[str] | tuple[str, ...]) -> list[str]:
    workspaces: list[str] = []
    if has_worker_role(roles):
        workspaces.append(WorkspaceId.WORKER)
    if has_admin_role(roles):
        workspaces.append(WorkspaceId.ADMINISTRATION)
    return workspaces


def primary_role(roles: list[str] | tuple[str, ...]) -> str:
    """Denormalised primary role for legacy sync fields."""
    if has_worker_role(roles):
        return AccountRole.WORKER
    if has_admin_role(roles):
        return AccountRole.ADMIN
    return AccountRole.WORKER
