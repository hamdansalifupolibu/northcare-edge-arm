"""Centralised community-request status transition engine."""

from __future__ import annotations

from dataclasses import dataclass

from northcare_api.reach.enums import (
    ALLOWED_TRANSITIONS,
    TERMINAL_STATUSES,
    CommunityRequestStatus,
)
from northcare_api.reach.errors import REACH_INVALID_TRANSITION


@dataclass(frozen=True, slots=True)
class TransitionResult:
    from_status: str
    to_status: str
    event_type: str


_EVENT_BY_TARGET: dict[str, str] = {
    CommunityRequestStatus.ASSIGNED: "community_request_assigned",
    CommunityRequestStatus.ACKNOWLEDGED: "community_request_acknowledged",
    CommunityRequestStatus.CONTACT_ATTEMPTED: "community_request_contact_attempted",
    CommunityRequestStatus.ESCALATED: "community_request_escalated",
    CommunityRequestStatus.HANDLED: "community_request_handled",
    CommunityRequestStatus.CANCELLED: "community_request_cancelled",
}


def can_transition(from_status: str, to_status: str) -> bool:
    if from_status in TERMINAL_STATUSES:
        return False
    return (from_status, to_status) in ALLOWED_TRANSITIONS


def apply_transition(from_status: str, to_status: str) -> TransitionResult:
    if not can_transition(from_status, to_status):
        raise REACH_INVALID_TRANSITION
    return TransitionResult(
        from_status=from_status,
        to_status=to_status,
        event_type=_EVENT_BY_TARGET.get(to_status, "community_request_status_changed"),
    )
