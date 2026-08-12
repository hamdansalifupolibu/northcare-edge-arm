"""NorthCare Reach error codes (safe, non-enumerating for public paths)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ReachError(Exception):
    code: str
    http_status: int = 400

    def __str__(self) -> str:
        return self.code


REACH_DISABLED = ReachError("reachDemoDisabled", 403)
REACH_VALIDATION_FAILED = ReachError("validationFailed", 422)
REACH_FACILITY_UNAVAILABLE = ReachError("reachFacilityUnavailable", 503)
REACH_INTERNAL = ReachError("internalError", 500)
REACH_STATUS_LOOKUP_FAILED = ReachError("statusLookupFailed", 404)
REACH_STATUS_LOOKUP_LOCKED = ReachError("statusLookupTemporarilyUnavailable", 429)
REACH_NOT_FOUND = ReachError("communityRequestNotFound", 404)
REACH_FORBIDDEN = ReachError("forbidden", 403)
REACH_WORKER_ROLE_REQUIRED = ReachError("workerRoleRequired", 403)
REACH_VERSION_CONFLICT = ReachError("communityRequestVersionConflict", 409)
REACH_ALREADY_ASSIGNED = ReachError("communityRequestAlreadyAssigned", 409)
REACH_INVALID_TRANSITION = ReachError("invalidCommunityRequestTransition", 400)
REACH_EMERGENCY_CAPABILITY_REQUIRED = ReachError("emergencyCapabilityRequired", 403)
