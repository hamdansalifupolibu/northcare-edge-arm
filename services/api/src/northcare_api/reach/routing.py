"""Deterministic community-request routing from the frozen R0 matrix."""

from __future__ import annotations

from dataclasses import dataclass

from northcare_api.administration.professions import WorkerProfession
from northcare_api.reach.enums import CommunityRequestCategory

# Profession preference order by category (community-request-routing-matrix.json).
CATEGORY_PROFESSION_PREFERENCE: dict[str, tuple[str, ...]] = {
    CommunityRequestCategory.PREGNANCY_NEWBORN: (
        WorkerProfession.MIDWIFE,
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
        WorkerProfession.COMMUNITY_HEALTH_NURSE,
    ),
    CommunityRequestCategory.CHILD_HEALTH: (
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
        WorkerProfession.COMMUNITY_HEALTH_NURSE,
        WorkerProfession.REGISTERED_GENERAL_NURSE,
        WorkerProfession.PHYSICIAN_ASSISTANT,
    ),
    CommunityRequestCategory.NUTRITION: (
        WorkerProfession.NUTRITION_OFFICER,
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
        WorkerProfession.COMMUNITY_HEALTH_NURSE,
    ),
    CommunityRequestCategory.GENERAL_CHPS: (
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
        WorkerProfession.COMMUNITY_HEALTH_NURSE,
        WorkerProfession.REGISTERED_GENERAL_NURSE,
    ),
    # referralFollowUp: no previous-worker linkage in the minimal R2 model; use fallback.
    CommunityRequestCategory.REFERRAL_FOLLOW_UP: (
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
        WorkerProfession.COMMUNITY_HEALTH_NURSE,
    ),
    CommunityRequestCategory.EMERGENCY: (
        WorkerProfession.EMERGENCY_MEDICAL_TECHNICIAN,
        WorkerProfession.COMMUNITY_HEALTH_OFFICER,
    ),
}


@dataclass(frozen=True, slots=True)
class RoutingCandidate:
    account_id: str
    profession: str
    community_requests_enabled: bool
    emergency_requests_enabled: bool


@dataclass(frozen=True, slots=True)
class RoutingResult:
    assigned_worker_id: str | None
    status: str  # received | assigned
    matched_profession_rank: int | None


def preferred_professions_for_category(category: str) -> tuple[str, ...]:
    return CATEGORY_PROFESSION_PREFERENCE.get(category, ())


def select_assignee(
    *,
    category: str,
    candidates: list[RoutingCandidate],
) -> RoutingResult:
    """Pick the first deterministic match by profession preference, then account ID."""
    preferences = preferred_professions_for_category(category)
    if not preferences:
        return RoutingResult(
            assigned_worker_id=None,
            status="received",
            matched_profession_rank=None,
        )

    require_emergency = category == CommunityRequestCategory.EMERGENCY
    eligible = [
        candidate
        for candidate in candidates
        if candidate.community_requests_enabled
        and (not require_emergency or candidate.emergency_requests_enabled)
        and candidate.profession in preferences
    ]
    if not eligible:
        return RoutingResult(
            assigned_worker_id=None,
            status="received",
            matched_profession_rank=None,
        )

    rank_by_profession = {profession: index for index, profession in enumerate(preferences)}
    eligible.sort(
        key=lambda item: (rank_by_profession[item.profession], item.account_id)
    )
    chosen = eligible[0]
    return RoutingResult(
        assigned_worker_id=chosen.account_id,
        status="assigned",
        matched_profession_rank=rank_by_profession[chosen.profession],
    )


def worker_matches_category(
    *,
    category: str,
    profession: str,
    community_requests_enabled: bool,
    emergency_requests_enabled: bool,
) -> bool:
    if not community_requests_enabled:
        return False
    if category == CommunityRequestCategory.EMERGENCY and not emergency_requests_enabled:
        return False
    return profession in preferred_professions_for_category(category)
