# Nutrition Assessment Template Model

**Stage:** 12  
**Date:** 2026-08-02

## Type

`NutritionAssessmentTemplateDefinition` — `apps/mobile/src/features/nutrition/domain/types.ts`

## Core fields

| Field | Purpose |
|---|---|
| `templateId` / `version` | Stable identity; persisted on assessment row |
| `status` | Content gate (`APPROVED_FOR_DEVELOPMENT`, `APPROVED_FOR_PILOT`, …) |
| `assessmentType` | e.g. `childNutrition`, `maternalNutrition` |
| `title` / `developmentBanner` | Worker-facing labels; banner when synthetic |
| `clinicalSourceRef` | Link to clinical source registry — **null** for synthetic dev |
| `applicableClientCategories` | Client category filter |
| `ageApplicability` | min/max age days, approximate age policy |
| `requiredMeasurementTypes` / `optionalMeasurementTypes` | Measurement expectations |
| `referencePackIds` / `guidancePackIds` | Linked interpretation/guidance packs |
| `sections` | `ScreeningSectionDefinition[]` (Stage 8 shape) |
| `knownLimitations` | Honest scope notes |

## Registered templates (development)

| templateId | assessmentType | status |
|---|---|---|
| `synthetic-dev-child-nutrition-v1` | `childNutrition` | `APPROVED_FOR_DEVELOPMENT` |
| `synthetic-dev-maternal-nutrition-v1` | `maternalNutrition` | `APPROVED_FOR_DEVELOPMENT` |

**Production `APPROVED_FOR_PILOT` count: 0**

## Section / question rules

- Questions use Stage 8 answer types (`yesNo`, `singleChoice`, `text`, `measurement`, …).
- Conditional visibility via `visibleWhen` (same as screening).
- Missing speech / unknown / not assessed remain distinct from negative answers.
- No clinical classification labels in template copy.

## Resolution

`resolveTemplateForNewAssessment()` filters by client category and optional assessment type.  
`getTemplateForPersistedAssessment()` resolves historical rows even if pack retired from new starts.

## Versioning

See `NUTRITION_CONTENT_VERSIONING.md`. Template version is stored on `nutrition_assessments.template_version`.
