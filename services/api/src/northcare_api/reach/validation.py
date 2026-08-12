"""Request-creation validation for NorthCare Reach public API."""

from __future__ import annotations

import re
import unicodedata

from northcare_api.reach.enums import (
    ALLOWED_CREATE_CHANNELS,
    CATEGORY_VALUES,
    MVP_PREFERRED_LANGUAGE,
    REQUEST_TYPE_VALUES,
    VALID_CATEGORY_TYPE_PAIRS,
    CommunityRequestCategory,
    CommunityRequestType,
)
from northcare_api.reach.errors import REACH_VALIDATION_FAILED

_CONTROL_CHAR = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_CONTACT_PATTERN = re.compile(r"^\+?[0-9]{8,15}$")
_MAX_LANDMARK = 200
_MAX_CONTACT = 20
_REPEATED_CHAR = re.compile(r"(.)\1{9,}")


def _clean_text(value: object, *, field: str, max_length: int) -> str:
    if not isinstance(value, str):
        raise REACH_VALIDATION_FAILED
    normalised = unicodedata.normalize("NFKC", value).strip()
    if not normalised:
        raise REACH_VALIDATION_FAILED
    if _CONTROL_CHAR.search(normalised):
        raise REACH_VALIDATION_FAILED
    if len(normalised) > max_length:
        raise REACH_VALIDATION_FAILED
    if _REPEATED_CHAR.search(normalised):
        raise REACH_VALIDATION_FAILED
    if field == "contact" and not _CONTACT_PATTERN.fullmatch(normalised):
        raise REACH_VALIDATION_FAILED
    return normalised


def validate_create_payload(payload: dict[str, object]) -> dict[str, object]:
    """Validate and normalise public create fields. Rejects unknown keys."""
    allowed = {
        "channel",
        "category",
        "requestType",
        "contactNumber",
        "communityOrLandmark",
        "preferredLanguage",
        "consentToContact",
        "consentToShareLocation",
    }
    if set(payload) - allowed:
        raise REACH_VALIDATION_FAILED

    channel = payload.get("channel")
    category = payload.get("category")
    request_type = payload.get("requestType")
    preferred_language = payload.get("preferredLanguage")
    consent_contact = payload.get("consentToContact")
    consent_location = payload.get("consentToShareLocation")

    if channel not in ALLOWED_CREATE_CHANNELS:
        raise REACH_VALIDATION_FAILED
    if category not in CATEGORY_VALUES:
        raise REACH_VALIDATION_FAILED
    if request_type not in REQUEST_TYPE_VALUES:
        raise REACH_VALIDATION_FAILED
    if (str(category), str(request_type)) not in VALID_CATEGORY_TYPE_PAIRS:
        raise REACH_VALIDATION_FAILED
    if preferred_language != MVP_PREFERRED_LANGUAGE:
        raise REACH_VALIDATION_FAILED
    if consent_contact is not True:
        raise REACH_VALIDATION_FAILED
    if not isinstance(consent_location, bool):
        raise REACH_VALIDATION_FAILED

    contact = _clean_text(payload.get("contactNumber"), field="contact", max_length=_MAX_CONTACT)
    landmark = _clean_text(
        payload.get("communityOrLandmark"),
        field="landmark",
        max_length=_MAX_LANDMARK,
    )

    if (
        category == CommunityRequestCategory.EMERGENCY
        and request_type == CommunityRequestType.EMERGENCY_ASSISTANCE
        and consent_location is not True
    ):
        raise REACH_VALIDATION_FAILED

    return {
        "channel": channel,
        "category": category,
        "requestType": request_type,
        "contactNumber": contact,
        "communityOrLandmark": landmark,
        "preferredLanguage": preferred_language,
        "consentToContact": True,
        "consentToShareLocation": bool(consent_location),
    }
