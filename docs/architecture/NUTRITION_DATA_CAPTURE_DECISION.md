# Nutrition Data Capture Decision

**Stage:** 12  
**Date:** 2026-08-02  
**Status:** Approved (implemented)

## Decision

**Hybrid reuse of Stage 8 screening capture** with **dedicated nutrition persistence**.

| Concern | Choice |
|---|---|
| Question schema | Reuse `ScreeningSectionDefinition` / `ScreeningQuestionDefinition` from Stage 8 |
| UI | Reuse `QuestionField` (`apps/mobile/src/features/screening/components/QuestionField.tsx`) |
| Answer semantics | Reuse Stage 8 `answerCodec` via nutrition adapter (`nutrition/engine/answerCodec.ts`) |
| Completeness | Reuse screening template engine patterns via `completenessEvaluator.ts` |
| Persistence | **Dedicated** `nutrition_assessment_answers` table — not `screening_answers` |
| Assessment header | `nutrition_assessments` — not `screenings` |

## Rationale

1. **Proven capture UX** — Stage 8 already handles yes/no, choice, text, measurement, unknown/notAssessed/declined/notApplicable states.
2. **Domain separation** — Nutrition assessments have their own lifecycle, reference results, and guidance resolutions; mixing rows into `screening_answers` would blur visit screening with nutrition workflows.
3. **Template versioning** — Nutrition templates carry reference/guidance pack IDs and assessment types independent of visit screening packs.
4. **Audit clarity** — Repositories and sync entity types stay distinct (`NutritionAssessmentRepository` vs `ScreeningRepository`).

## What is reused (exact paths)

```text
apps/mobile/src/features/screening/content/types.ts          # Section/question types
apps/mobile/src/features/screening/components/QuestionField.tsx
apps/mobile/src/features/screening/engine/answerCodec.ts       # encode/decode (via adapter)
```

Nutrition adapter:

```text
apps/mobile/src/features/nutrition/engine/answerCodec.ts
```

Maps `nutritionAssessmentId` ↔ adapter parameter named `screeningId` internally for codec reuse only.

## What is not reused

- `screenings` / `screening_answers` tables for new nutrition capture
- Visit screening routes or `createVisitServices` screening flow
- Stage 9 risk rule inputs from nutrition answers (no automatic wiring)

## Template definition

Nutrition templates (`NutritionAssessmentTemplateDefinition`) embed `sections: ScreeningSectionDefinition[]` but add nutrition-specific metadata: `assessmentType`, `referencePackIds`, `guidancePackIds`, `requiredMeasurementTypes`, age applicability, and content status gates.

## Fail-closed capture

If no environment-allowed template exists, `startAssessment` returns `unavailable` — same gate pattern as Stage 8 production screening.

## Future considerations

- Shared abstract "form engine" package is **not** introduced in Stage 12; duplication is limited to the adapter layer.
- Pilot clinical nutrition templates will use the same hybrid path once clinically reviewed and marked `APPROVED_FOR_PILOT`.
