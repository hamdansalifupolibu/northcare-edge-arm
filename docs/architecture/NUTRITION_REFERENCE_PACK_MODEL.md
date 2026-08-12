# Nutrition Reference Pack Model

**Stage:** 12  
**Date:** 2026-08-02

## Purpose

Reference packs map captured answers and measurements to **interpretation codes** and optional derived values. They do **not** emit caregiver guidance text.

## Type

`NutritionReferencePackDefinition` — `apps/mobile/src/features/nutrition/domain/types.ts`

## Core fields

| Field | Purpose |
|---|---|
| `referencePackId` / `version` | Pack identity |
| `status` | Content gate |
| `engineCompatibilityVersion` | Must match `NUTRITION_ENGINE_VERSION` (currently **1**) |
| `applicableAssessmentTemplateIds` | Template allow-list |
| `requiredMeasurements` / `supportedUnits` | Measurement prerequisites |
| `rules[]` | Ordered deterministic rules |
| `clinicalSourceRef` | **null** for synthetic dev |

## Rule shape

Each `NutritionReferenceRule` has:

- `condition` — composable (`hasMeasurement`, `answerEquals`, `answerState`, `all`, `any`)
- `interpretationCode` — stable code for guidance lookup
- `explanationId` — worker-facing explanation key (not diagnosis)
- `derivedValueExpression` — optional numeric derivation from measurement

## Synthetic development pack

| referencePackId | status | interpretation codes |
|---|---|---|
| `synthetic-dev-nutrition-reference-v1` | `APPROVED_FOR_DEVELOPMENT` | `developmentCategoryA`, `developmentCategoryB` only |

**Never uses:** `normal`, `wasted`, `stunted`, `malnourished`, or other clinical classification labels.

## Production

**`APPROVED_FOR_PILOT` reference packs: 0** — engine returns `referencePackUnavailable` / fail-closed UI.

## Persistence

Results stored in `nutrition_reference_results` with pack ID, version, engine version, status, interpretation code, missing information JSON, and supersession chain.
