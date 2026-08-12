"""NorthCare Reach community-request enums (frozen R0 values)."""

from __future__ import annotations

from enum import StrEnum


class CommunityRequestCategory(StrEnum):
    PREGNANCY_NEWBORN = "pregnancyNewborn"
    CHILD_HEALTH = "childHealth"
    NUTRITION = "nutrition"
    GENERAL_CHPS = "generalChps"
    REFERRAL_FOLLOW_UP = "referralFollowUp"
    EMERGENCY = "emergency"


class CommunityRequestType(StrEnum):
    ROUTINE = "routine"
    URGENT_CONTACT = "urgentContact"
    EMERGENCY_ASSISTANCE = "emergencyAssistance"


class CommunityRequestStatus(StrEnum):
    RECEIVED = "received"
    ASSIGNED = "assigned"
    ACKNOWLEDGED = "acknowledged"
    CONTACT_ATTEMPTED = "contactAttempted"
    ESCALATED = "escalated"
    HANDLED = "handled"
    CANCELLED = "cancelled"


class CommunityRequestChannel(StrEnum):
    USSD_SIMULATOR = "ussdSimulator"
    USSD_AT_SANDBOX = "ussdAfricasTalkingSandbox"
    # Declared for forward compatibility; rejected by create validation until a live stage.
    USSD_AT_LIVE = "ussdAfricasTalkingLive"


class CommunityRequestListFilter(StrEnum):
    AWAITING = "awaiting"
    ASSIGNED_TO_ME = "assignedToMe"
    EMERGENCY = "emergency"
    HANDLED = "handled"


CATEGORY_VALUES: frozenset[str] = frozenset(item.value for item in CommunityRequestCategory)
REQUEST_TYPE_VALUES: frozenset[str] = frozenset(item.value for item in CommunityRequestType)
STATUS_VALUES: frozenset[str] = frozenset(item.value for item in CommunityRequestStatus)
CHANNEL_VALUES: frozenset[str] = frozenset(item.value for item in CommunityRequestChannel)
# Channels accepted on public create in T1 (live remains blocked).
ALLOWED_CREATE_CHANNELS: frozenset[str] = frozenset(
    {
        CommunityRequestChannel.USSD_SIMULATOR,
        CommunityRequestChannel.USSD_AT_SANDBOX,
    }
)

TERMINAL_STATUSES: frozenset[str] = frozenset(
    {
        CommunityRequestStatus.HANDLED,
        CommunityRequestStatus.CANCELLED,
    }
)

# Exact R0 transition registry (community-request-statuses.json).
ALLOWED_TRANSITIONS: frozenset[tuple[str, str]] = frozenset(
    {
        (CommunityRequestStatus.RECEIVED, CommunityRequestStatus.ASSIGNED),
        (CommunityRequestStatus.RECEIVED, CommunityRequestStatus.CANCELLED),
        (CommunityRequestStatus.ASSIGNED, CommunityRequestStatus.ACKNOWLEDGED),
        (CommunityRequestStatus.ASSIGNED, CommunityRequestStatus.CANCELLED),
        (CommunityRequestStatus.ACKNOWLEDGED, CommunityRequestStatus.CONTACT_ATTEMPTED),
        (CommunityRequestStatus.ACKNOWLEDGED, CommunityRequestStatus.ESCALATED),
        (CommunityRequestStatus.ACKNOWLEDGED, CommunityRequestStatus.CANCELLED),
        (CommunityRequestStatus.ESCALATED, CommunityRequestStatus.CONTACT_ATTEMPTED),
        (CommunityRequestStatus.CONTACT_ATTEMPTED, CommunityRequestStatus.HANDLED),
    }
)

PUBLIC_STATUS_LABELS: dict[str, str] = {
    CommunityRequestStatus.RECEIVED: "Request received",
    CommunityRequestStatus.ASSIGNED: "Waiting for review",
    CommunityRequestStatus.ACKNOWLEDGED: "Health worker acknowledged",
    CommunityRequestStatus.CONTACT_ATTEMPTED: "Contact attempt recorded",
    CommunityRequestStatus.ESCALATED: "Escalated for further support",
    CommunityRequestStatus.HANDLED: "Request handled",
    CommunityRequestStatus.CANCELLED: "Request cancelled",
}

# Valid category/requestType pairs from frozen USSD flow + R0 enums.
VALID_CATEGORY_TYPE_PAIRS: frozenset[tuple[str, str]] = frozenset(
    {
        (CommunityRequestCategory.PREGNANCY_NEWBORN, CommunityRequestType.ROUTINE),
        (CommunityRequestCategory.CHILD_HEALTH, CommunityRequestType.ROUTINE),
        (CommunityRequestCategory.NUTRITION, CommunityRequestType.ROUTINE),
        (CommunityRequestCategory.GENERAL_CHPS, CommunityRequestType.ROUTINE),
        (CommunityRequestCategory.REFERRAL_FOLLOW_UP, CommunityRequestType.ROUTINE),
        (CommunityRequestCategory.EMERGENCY, CommunityRequestType.EMERGENCY_ASSISTANCE),
        (CommunityRequestCategory.EMERGENCY, CommunityRequestType.URGENT_CONTACT),
    }
)

MVP_PREFERRED_LANGUAGE = "en"
