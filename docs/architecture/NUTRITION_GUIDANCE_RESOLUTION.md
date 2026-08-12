# Nutrition Guidance Resolution

**Stage:** 12  
**Date:** 2026-08-02

## Location

`apps/mobile/src/features/nutrition/engine/guidanceResolver.ts`

## Input

```text
GuidanceResolutionInput {
  pack, packLoadable, templateId, clientCategory,
  answers, referenceResult
}
```

## Algorithm

1. Fail closed if pack not loadable → `guidancePackUnavailable`.
2. Verify template, category, and reference pack compatibility.
3. Require reference interpretation code when pack expects one.
4. Evaluate each card's `applicableConditions` against answers + interpretation code.
5. Sort matched cards by `priorityOrder`.
6. Return `NutritionGuidanceResolutionResult` with outcome, card list, guidance IDs, development banner.

## Outcomes

`guidanceAvailable`, `guidanceUnavailable`, `guidancePackUnavailable`, `moreInformationRequired`, `incompatibleContent`, `contentRetired`, `resolutionFailed`

## Explicit non-behaviour

- **No LLM** — resolver never invents generic advice.
- **No Stage 9 trigger** — does not call risk engine or create `risk_assessments`.
- **No Stage 10 trigger** — does not create referrals or QR passports.
- **No auto-acknowledgement** — worker must acknowledge on guidance screen.

## UI

- `NutritionGuidanceScreen` — cards via `NutritionGuidanceCard`
- `NutritionGuidanceUnavailableState` — fail-closed messaging
- `DevelopmentBanner` — when `isDevelopment`

## Tests

`guidanceResolution.test.ts`, `contentGovernance.test.ts`

## Related

`docs/safety/NUTRITION_GUIDANCE_SAFETY_BOUNDARY.md`
