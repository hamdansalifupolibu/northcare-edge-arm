"""Frozen NorthCare Reach worker profession registry (R0/R1)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class WorkerProfession(StrEnum):
    COMMUNITY_HEALTH_OFFICER = "communityHealthOfficer"
    COMMUNITY_HEALTH_NURSE = "communityHealthNurse"
    REGISTERED_GENERAL_NURSE = "registeredGeneralNurse"
    MIDWIFE = "midwife"
    NUTRITION_OFFICER = "nutritionOfficer"
    PHYSICIAN_ASSISTANT = "physicianAssistant"
    EMERGENCY_MEDICAL_TECHNICIAN = "emergencyMedicalTechnician"
    OTHER_APPROVED_HEALTH_PROFESSIONAL = "otherApprovedHealthProfessional"


OTHER_PROFESSION = WorkerProfession.OTHER_APPROVED_HEALTH_PROFESSIONAL
OTHER_PROFESSION_DESCRIPTION_MAX_LENGTH = 120


@dataclass(frozen=True, slots=True)
class ProfessionDefinition:
    value: WorkerProfession
    label: str
    display_order: int
    active: bool = True
    allows_other_description: bool = False


PROFESSION_REGISTRY: tuple[ProfessionDefinition, ...] = (
    ProfessionDefinition(
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
        "Community Health Officer",
        1,
    ),
    ProfessionDefinition(
        WorkerProfession.COMMUNITY_HEALTH_NURSE,
        "Community Health Nurse",
        2,
    ),
    ProfessionDefinition(
        WorkerProfession.REGISTERED_GENERAL_NURSE,
        "Registered General Nurse",
        3,
    ),
    ProfessionDefinition(WorkerProfession.MIDWIFE, "Midwife", 4),
    ProfessionDefinition(
        WorkerProfession.NUTRITION_OFFICER,
        "Nutrition Officer",
        5,
    ),
    ProfessionDefinition(
        WorkerProfession.PHYSICIAN_ASSISTANT,
        "Physician Assistant",
        6,
    ),
    ProfessionDefinition(
        WorkerProfession.EMERGENCY_MEDICAL_TECHNICIAN,
        "Emergency Medical Technician",
        7,
    ),
    ProfessionDefinition(
        WorkerProfession.OTHER_APPROVED_HEALTH_PROFESSIONAL,
        "Other approved health professional",
        8,
        allows_other_description=True,
    ),
)

PROFESSION_VALUES: frozenset[str] = frozenset(item.value for item in PROFESSION_REGISTRY)
PROFESSION_BY_VALUE: dict[str, ProfessionDefinition] = {
    item.value: item for item in PROFESSION_REGISTRY
}


def list_active_professions() -> list[ProfessionDefinition]:
    return [item for item in PROFESSION_REGISTRY if item.active]


def is_supported_profession(value: str) -> bool:
    return value in PROFESSION_VALUES


def allows_other_description(value: str) -> bool:
    definition = PROFESSION_BY_VALUE.get(value)
    return bool(definition and definition.allows_other_description)
