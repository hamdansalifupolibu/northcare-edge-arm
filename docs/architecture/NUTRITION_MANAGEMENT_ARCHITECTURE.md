# Nutrition Management Architecture

**Stage:** 12  
**Date:** 2026-08-02  
**Status:** Implemented

## Overview

Nutrition assessment separates **capture**, **reference evaluation**, and **guidance resolution**. Workers complete schema-driven assessments offline; reference and guidance engines run deterministically from gated content packs. Production fails closed when no `APPROVED_FOR_PILOT` content exists.

## Feature layout

```text
apps/mobile/src/features/nutrition/
├── application/createNutritionServices.ts   # Orchestration — draft, answers, complete, guidance
├── content/
│   ├── registry.ts                          # Environment-gated template/reference/guidance load
│   ├── assessments/                         # Synthetic dev templates (child + maternal)
│   ├── references/                          # Synthetic dev reference pack
│   └── guidance/                            # Synthetic dev guidance pack
├── domain/                                  # Types, statuses, errors
├── engine/
│   ├── answerCodec.ts                       # Adapts Stage 8 answer codec → nutrition rows
│   ├── completenessEvaluator.ts             # Section completeness via screening adapter
│   ├── templateResolver.ts                  # Client age/category applicability
│   ├── referenceEvaluator.ts                # Deterministic reference engine v1
│   └── guidanceResolver.ts                  # Deterministic guidance resolution
├── screens/                                 # History, section, review, guidance, …
├── components/                              # Cards, banners, unavailable states
├── hooks/useNutritionServices.ts
└── __tests__/                               # 8 suites — governance, engines, rollback

apps/mobile/src/data/repositories/sqlite/sqliteNutritionRepositories.ts
apps/mobile/src/data/database/migrations/006_nutrition_assessment_engine.ts
```

Routes (worker, auth-gated):

- Client nutrition: `/(worker)/clients/[clientId]/nutrition/*`
- Development: `/(development)/nutrition-preview`

Entry points: client profile; visit details (optional encounter link).

## Assessment lifecycle

```text
draft → inProgress → reviewRequired → completed
  |                      |
  discarded            corrected (supersedes prior completed)
```

Capture uses Stage 8 `QuestionField` and answer semantics. Reference and guidance run at review/complete — not during every keystroke.

## Data model (schema v6)

| Table | Purpose |
|---|---|
| `nutrition_assessments` | Header — template, status, progress, confirmation, supersession |
| `nutrition_assessment_answers` | Typed answers (dedicated table; not `screening_answers`) |
| `nutrition_measurement_links` | Links assessments to `measurements` rows |
| `nutrition_reference_results` | Persisted reference evaluation |
| `nutrition_guidance_resolutions` | Persisted guidance resolution + acknowledgement |

Legacy Stage 6 columns on `nutrition_assessments` remain nullable; Stage 12 workflow uses template-driven capture.

## Content gates

| Gate | Production | Development |
|---|---|---|
| Templates (`APPROVED_FOR_PILOT`) | **0** — unavailable | 2 synthetic `APPROVED_FOR_DEVELOPMENT` |
| Reference packs | **0** | 1 synthetic |
| Guidance packs | **0** | 1 synthetic |

Registry: `apps/mobile/src/features/nutrition/content/registry.ts`  
Inventories: `implementation/nutrition-*-inventory.json`

## Cross-stage boundaries

- **Stage 8:** Reuses screening question types, `QuestionField`, and `answerCodec` semantics (see `NUTRITION_DATA_CAPTURE_DECISION.md`).
- **Stage 9 / 10:** Guidance does **not** auto-trigger risk assessment or referral creation.
- **Measurements:** Reuses Stage 6 `measurements` table via link rows (see `NUTRITION_MEASUREMENT_INTEGRATION.md`).

## Related docs

- `NUTRITION_DATA_CAPTURE_DECISION.md`
- `NUTRITION_REFERENCE_ENGINE.md`
- `NUTRITION_GUIDANCE_RESOLUTION.md`
- `docs/safety/NUTRITION_CONTENT_GOVERNANCE.md`
- `docs/development/stages/STAGE_12_NUTRITION_GUIDANCE.md`
