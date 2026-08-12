# Nutrition Reference Engine

**Stage:** 12  
**Date:** 2026-08-02  
**Engine version:** 1 (`NUTRITION_ENGINE_VERSION`)

## Location

`apps/mobile/src/features/nutrition/engine/referenceEvaluator.ts`

## Input

```text
ReferenceEvaluationInput {
  pack, packLoadable, answers, measurements, age
}
```

## Algorithm

1. Fail closed if pack null or not loadable for environment → `referencePackUnavailable`.
2. Validate age applicability → `incompatibleAge` when required exact age missing.
3. Validate required measurements and units → `insufficientInformation`, `incompatibleMeasurements`, `unsupportedUnit`.
4. Evaluate rules in **order**; first matching rule wins.
5. Derive numeric value when rule specifies `measurementNumeric` (uses Stage 9 unit conversion helpers).
6. Return `NutritionReferenceEvaluationResult` with status, interpretation code, missing information, development banner.

## Result statuses

`available`, `calculated`, `insufficientInformation`, `incompatibleMeasurements`, `incompatibleAge`, `unsupportedUnit`, `referencePackUnavailable`, `referencePackUnapproved`, `calculationFailed`

## Synthetic codes only (development)

- `developmentCategoryA`
- `developmentCategoryB`

No WHO growth-standard logic. No clinical malnutrition labels.

## Persistence

`createNutritionServices.completeAssessment` persists to `nutrition_reference_results` with `engine_version = 1`.

## Tests

`referenceEngine.test.ts`, `measurementIntegration.test.ts`
