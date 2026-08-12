# Nutrition Guidance Pack Model

**Stage:** 12  
**Date:** 2026-08-02

## Purpose

Guidance packs provide **reviewed caregiver-facing cards** matched deterministically from reference interpretation codes and answer conditions. Not LLM-generated.

## Type

`NutritionGuidancePackDefinition` — `apps/mobile/src/features/nutrition/domain/types.ts`

## Core fields

| Field | Purpose |
|---|---|
| `guidancePackId` / `version` | Pack identity |
| `status` | Content gate |
| `applicableAssessmentTemplateIds` | Template allow-list |
| `applicableReferencePackIds` | Reference pack allow-list |
| `applicableInterpretationCodes` | Allowed interpretation codes |
| `cards[]` | Ordered guidance cards |
| `effectiveDate` / `retiredDate` | Lifecycle — **null** for synthetic dev |
| `clinicalSourceRef` | **null** for synthetic dev |

## Card shape

`NutritionGuidanceCard`:

- `guidanceId`, `heading`, `body`
- `workerActionText`, `caregiverFacingText`
- `applicableConditions` — deterministic matcher
- `priorityOrder` — stable sort
- `reviewStatus`, `translationStatus` (`enOnly` for dev)

## Synthetic development pack

| guidancePackId | status | cards |
|---|---|---|
| `synthetic-dev-nutrition-guidance-v1` | `APPROVED_FOR_DEVELOPMENT` | `development-guidance-card-d`, `development-guidance-card-e` |

## Production

**`APPROVED_FOR_PILOT` guidance packs: 0** — resolution returns `guidancePackUnavailable`.

## Safety

- No dosage, therapeutic feeding, or disease-specific diet claims in synthetic content.
- Guidance display requires completed assessment and successful resolution (or explicit unavailable state).
- Does not auto-create Stage 9 risk or Stage 10 referrals.

## Acknowledgement

Workers acknowledge guidance via `acknowledgeGuidance`; persisted on `nutrition_guidance_resolutions`.
