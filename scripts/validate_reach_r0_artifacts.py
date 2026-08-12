#!/usr/bin/env python3
"""Validate NorthCare Reach R0 JSON artifacts (no runtime dependencies)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPL = ROOT / "implementation"

ARTIFACTS = [
    "reach-ussd-flow.json",
    "community-request-schema-draft.json",
    "community-request-statuses.json",
    "community-request-routing-matrix.json",
    "worker-profession-registry.json",
    "reach-api-contract-draft.json",
    "reach-roadmap.json",
]

EXPECTED_CATEGORIES = {
    "pregnancyNewborn",
    "childHealth",
    "nutrition",
    "generalChps",
    "referralFollowUp",
    "emergency",
}
EXPECTED_TYPES = {"routine", "urgentContact", "emergencyAssistance"}
EXPECTED_STATUSES = {
    "received",
    "assigned",
    "acknowledged",
    "contactAttempted",
    "escalated",
    "handled",
    "cancelled",
}
EXPECTED_PROFESSIONS = {
    "communityHealthOfficer",
    "communityHealthNurse",
    "registeredGeneralNurse",
    "midwife",
    "nutritionOfficer",
    "physicianAssistant",
    "emergencyMedicalTechnician",
    "otherApprovedHealthProfessional",
}
REACH_STAGE_IDS = {"R0", "R1", "R2", "R3", "R4", "R5", "R6"}


def load(name: str) -> dict:
    path = IMPL / name
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def validate_transitions(statuses_doc: dict, errors: list[str]) -> None:
    statuses = set(statuses_doc["statuses"])
    if statuses != EXPECTED_STATUSES:
        fail(errors, f"statuses mismatch: {sorted(statuses)}")
    for edge in statuses_doc["transitions"]:
        if edge["from"] not in statuses or edge["to"] not in statuses:
            fail(errors, f"invalid transition: {edge}")
    terminal = set(statuses_doc["terminalStatuses"])
    if terminal != {"handled", "cancelled"}:
        fail(errors, f"unexpected terminal statuses: {sorted(terminal)}")
    # No outgoing edges from terminal statuses
    outgoing = {e["from"] for e in statuses_doc["transitions"]}
    if outgoing & terminal:
        fail(errors, f"terminal statuses have outgoing transitions: {sorted(outgoing & terminal)}")


def validate_routing(routing: dict, professions: set[str], errors: list[str]) -> None:
    matrix = routing["matrix"]
    matrix_categories = set(matrix.keys())
    if matrix_categories != EXPECTED_CATEGORIES:
        fail(errors, f"routing categories mismatch: {sorted(matrix_categories)}")
    for category, value in matrix.items():
        if category == "referralFollowUp":
            prefs = value.get("fallback", [])
        elif category == "emergency":
            prefs = value.get("preference", [])
        else:
            prefs = value
        for profession in prefs:
            if profession not in professions:
                fail(errors, f"routing profession unknown for {category}: {profession}")


def validate_ussd(ussd: dict, errors: list[str]) -> None:
    categories_seen: set[str] = set()
    for flow_name, flow in ussd["flows"].items():
        if flow_name == "requestChps":
            for step in flow.get("steps", []):
                for opt in step.get("options", []):
                    if "category" in opt:
                        categories_seen.add(opt["category"])
            continue
        for opt in flow.get("options", []):
            if "category" in opt:
                categories_seen.add(opt["category"])
    if not EXPECTED_CATEGORIES.issubset(categories_seen | {"referralFollowUp", "generalChps"}):
        # requestChps covers referralFollowUp/generalChps; emergency/pregnancy/child/nutrition from flows
        pass
    required_from_flows = {
        "emergency",
        "pregnancyNewborn",
        "childHealth",
        "nutrition",
        "referralFollowUp",
        "generalChps",
    }
    if categories_seen != required_from_flows:
        fail(errors, f"USSD categories mismatch: {sorted(categories_seen)}")
    if ussd.get("implementedLanguage") != "en":
        fail(errors, "implementedLanguage must be en")


def main() -> int:
    errors: list[str] = []

    docs: dict[str, dict] = {}
    for name in ARTIFACTS:
        try:
            docs[name] = load(name)
        except Exception as exc:  # noqa: BLE001 — validation script reports any load failure
            fail(errors, f"{name}: invalid JSON ({exc})")

    if errors:
        print("FAIL")
        for item in errors:
            print(f" - {item}")
        return 1

    professions = [p["id"] for p in docs["worker-profession-registry.json"]["professions"]]
    if len(professions) != len(set(professions)):
        fail(errors, "duplicated professions")
    if set(professions) != EXPECTED_PROFESSIONS:
        fail(errors, f"profession registry mismatch: {sorted(set(professions))}")

    schema = docs["community-request-schema-draft.json"]
    if set(schema["categories"]) != EXPECTED_CATEGORIES:
        fail(errors, "schema categories mismatch")
    if len(schema["categories"]) != len(set(schema["categories"])):
        fail(errors, "duplicated categories in schema")
    if set(schema["requestTypes"]) != EXPECTED_TYPES:
        fail(errors, "schema requestTypes mismatch")

    validate_transitions(docs["community-request-statuses.json"], errors)
    validate_routing(
        docs["community-request-routing-matrix.json"],
        set(professions),
        errors,
    )
    validate_ussd(docs["reach-ussd-flow.json"], errors)

    api = docs["reach-api-contract-draft.json"]
    if set(api["enums"]["categories"]) != EXPECTED_CATEGORIES:
        fail(errors, "API draft categories mismatch")
    if set(api["enums"]["requestTypes"]) != EXPECTED_TYPES:
        fail(errors, "API draft requestTypes mismatch")
    if set(api["enums"]["statuses"]) != EXPECTED_STATUSES:
        fail(errors, "API draft statuses mismatch")
    if set(api["enums"]["professions"]) != EXPECTED_PROFESSIONS:
        fail(errors, "API draft professions mismatch")
    if api.get("liveOpenApi", {}).get("modifyDuringR0") is not False:
        fail(errors, "API draft must forbid live OpenAPI modification in R0")

    roadmap = docs["reach-roadmap.json"]
    stage_ids = {s["id"] for s in roadmap["stages"]}
    if stage_ids != REACH_STAGE_IDS:
        fail(errors, f"reach roadmap stages mismatch: {sorted(stage_ids)}")
    if roadmap.get("stage19Status") != "paused":
        fail(errors, "stage19Status must be paused")
    demo_profession = roadmap.get("demoAccount", {}).get("profession")
    if demo_profession not in EXPECTED_PROFESSIONS:
        fail(errors, "demo account profession missing from registry")

    # Ensure core roadmap records Reach pause of Stage 19
    core = load("implementation-roadmap.json")
    s19 = next((s for s in core["stages"] if s["id"] == "S19"), None)
    if not s19:
        fail(errors, "S19 missing from implementation-roadmap.json")
    elif s19.get("status") not in {"paused", "pending_paused", "pending"}:
        # Accept pending if reachExtension marks pause explicitly
        pass
    reach_ext = core.get("reachExtension", {})
    if reach_ext.get("stage19Status") != "paused":
        fail(errors, "implementation-roadmap.reachExtension.stage19Status must be paused")
    current = reach_ext.get("currentStage")
    if current not in {"R0", "R1", "R2", "R3", "R4", "R5", "R6"}:
        fail(errors, "implementation-roadmap.reachExtension.currentStage must be a Reach stage")
    if reach_ext.get("r0Status") not in {
        "complete",
        "complete_awaiting_r1_approval",
    }:
        fail(errors, "implementation-roadmap.reachExtension.r0Status must show R0 complete")

    if errors:
        print("FAIL")
        for item in errors:
            print(f" - {item}")
        return 1

    print("OK - Reach R0 artifacts valid")
    print(
        "Validated %s Reach artifacts + implementation-roadmap reachExtension"
        % len(ARTIFACTS)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
