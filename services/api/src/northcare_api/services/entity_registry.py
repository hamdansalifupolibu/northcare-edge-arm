from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

# Accept historical mobile camelCase enqueue names alongside protocol registry names.
_ALIASES: dict[str, str] = {
    "nutritionAssessment": "nutrition_assessment",
    "nutritionReferenceResult": "nutrition_reference_result",
    "nutritionGuidanceResolution": "nutrition_guidance_resolution",
    "voiceCaptureSession": "voice_capture_session",
    "voiceTranscript": "voice_transcript",
    "voiceExtractionRun": "voice_extraction_run",
    "riskAssessment": "risk_assessment",
    "referralEvent": "referral_event",
    "referralPassport": "referral_passport",
    "clientRelationship": "client_relationship",
    "assistantFeedback": "assistant_feedback",
    "followUpReminder": "follow_up_reminder",
}


def resolve_registry_path() -> Path:
    """Locate sync-entity-registry.json in Docker (/app/resources) or monorepo layout."""
    start = Path(__file__).resolve().parent
    for directory in (start, *start.parents):
        for relative in (
            Path("resources") / "sync-entity-registry.json",
            Path("implementation") / "sync-entity-registry.json",
        ):
            candidate = directory / relative
            if candidate.is_file():
                return candidate
    raise FileNotFoundError(
        "sync-entity-registry.json not found (expected services/api/resources "
        "or repo implementation/)"
    )


def normalize_entity_type(entity_type: str) -> str:
    return _ALIASES.get(entity_type, entity_type)


@lru_cache
def load_entity_registry() -> dict[str, dict[str, str]]:
    data = json.loads(resolve_registry_path().read_text(encoding="utf-8"))
    out: dict[str, dict[str, str]] = {}
    for entity in data["entities"]:
        if entity.get("syncEnabled"):
            out[entity["entityType"]] = {
                "conflictClass": entity["conflictClass"],
            }
    return out


def conflict_class_for(entity_type: str) -> str | None:
    entry = load_entity_registry().get(normalize_entity_type(entity_type))
    return entry["conflictClass"] if entry else None


def is_supported_entity(entity_type: str) -> bool:
    return normalize_entity_type(entity_type) in load_entity_registry()
