"""Worker professional profile validation (Reach R1)."""

from __future__ import annotations

from dataclasses import dataclass

from northcare_api.administration.errors import VALIDATION_FAILED
from northcare_api.administration.professions import (
    OTHER_PROFESSION_DESCRIPTION_MAX_LENGTH,
    allows_other_description,
    is_supported_profession,
)


@dataclass(frozen=True, slots=True)
class ValidatedProfessionalProfileInput:
    profession: str
    other_profession_description: str | None
    community_requests_enabled: bool
    emergency_requests_enabled: bool


def validate_professional_profile_input(
    *,
    profession: str | None,
    other_profession_description: str | None,
    community_requests_enabled: bool,
    emergency_requests_enabled: bool,
) -> ValidatedProfessionalProfileInput:
    if profession is None or not is_supported_profession(profession):
        raise VALIDATION_FAILED

    description: str | None = None
    if allows_other_description(profession):
        if other_profession_description is None:
            raise VALIDATION_FAILED
        cleaned = other_profession_description.strip()
        if not cleaned or len(cleaned) > OTHER_PROFESSION_DESCRIPTION_MAX_LENGTH:
            raise VALIDATION_FAILED
        description = cleaned
    elif other_profession_description is not None and other_profession_description.strip():
        raise VALIDATION_FAILED

    if emergency_requests_enabled and not community_requests_enabled:
        raise VALIDATION_FAILED

    return ValidatedProfessionalProfileInput(
        profession=profession,
        other_profession_description=description,
        community_requests_enabled=community_requests_enabled,
        emergency_requests_enabled=emergency_requests_enabled,
    )
