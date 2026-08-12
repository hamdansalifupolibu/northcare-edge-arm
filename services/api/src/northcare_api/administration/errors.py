from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class AdministrationError(Exception):
    code: str
    http_status: int = 400

    def __str__(self) -> str:
        return self.code


ADMINISTRATION_REQUIRES_CONNECTIVITY = AdministrationError(
    "administrationRequiresConnectivity", 503
)
ADMINISTRATOR_AUTHENTICATION_REQUIRED = AdministrationError(
    "administratorAuthenticationRequired", 401
)
ADMINISTRATOR_REAUTHENTICATION_REQUIRED = AdministrationError(
    "administratorReauthenticationRequired", 401
)
ADMINISTRATOR_ROLE_REQUIRED = AdministrationError("administratorRoleRequired", 403)
ACCOUNT_NOT_FOUND = AdministrationError("accountNotFound", 404)
ACCOUNT_ALREADY_EXISTS = AdministrationError("accountAlreadyExists", 409)
ACCOUNT_VERSION_CONFLICT = AdministrationError("accountVersionConflict", 409)
FACILITY_NOT_FOUND = AdministrationError("facilityNotFound", 404)
FACILITY_NOT_ASSIGNABLE = AdministrationError("facilityNotAssignable", 400)
IDENTITY_PROVIDER_UNAVAILABLE = AdministrationError("identityProviderUnavailable", 503)
IDENTITY_PROVISIONING_FAILED = AdministrationError("identityProvisioningFailed", 502)
PASSWORD_RESET_UNAVAILABLE = AdministrationError("passwordResetUnavailable", 503)
INVALID_ACCOUNT_TRANSITION = AdministrationError("invalidAccountTransition", 400)
LAST_ADMINISTRATOR_PROTECTED = AdministrationError("lastAdministratorProtected", 409)
DEVICE_NOT_FOUND = AdministrationError("deviceNotFound", 404)
DEVICE_ALREADY_REVOKED = AdministrationError("deviceAlreadyRevoked", 409)
FORBIDDEN = AdministrationError("forbidden", 403)
VALIDATION_FAILED = AdministrationError("validationFailed", 422)
BACKEND_UNAVAILABLE = AdministrationError("backendUnavailable", 503)
INTERNAL_ERROR = AdministrationError("internalError", 500)
IDEMPOTENCY_KEY_REUSED = AdministrationError("idempotencyKeyConflict", 409)
PROFILE_VERSION_CONFLICT = AdministrationError("profileVersionConflict", 409)
WORKER_ROLE_REQUIRED = AdministrationError("workerRoleRequired", 400)
