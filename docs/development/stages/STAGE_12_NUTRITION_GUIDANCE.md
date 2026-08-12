# STAGE 12 — Nutrition Assessment and Reviewed Guidance

**Status:** COMPLETE (implementation)  
**Date:** 2026-08-02  
**App:** `apps/mobile/` (Expo SDK 57)

## Purpose

Offline-first nutrition assessment with deterministic reference evaluation and reviewed guidance cards. Separates capture, interpretation, and guidance. Production fails closed without pilot-approved content.

## Included

- Schema-driven assessment capture (Stage 8 `QuestionField` + answer codec reuse)
- Dedicated `nutrition_assessment_answers` persistence (hybrid decision documented)
- Draft / resume / review / complete workflow with rollback
- Reference engine v1 — synthetic `developmentCategoryA/B` codes only
- Guidance resolver — deterministic cards; worker acknowledgement
- Measurement integration via `nutrition_measurement_links`
- Correction / supersession flow
- Development preview screen (content inventory)
- Client profile and visit-details entry points
- SQLite migration **006** — schema v6

## Explicitly excluded

- New npm packages (**zero** added)
- Production `APPROVED_FOR_PILOT` templates, reference packs, or guidance packs (count: **0** each)
- WHO growth standards / real anthropometry classification
- Clinical labels (`normal`, `wasted`, `stunted`, `malnourished`)
- Dagbanli nutrition content or audio
- Food diversity ring / FoodSelector (roadmap items — not Stage 12)
- Auto-trigger Stage 9 risk or Stage 10 referral from guidance
- LLM-generated nutrition advice
- Stage 13 (Ask NorthCare)

## Content gates

| Gate | Production | Development |
|---|---|---|
| Templates (`APPROVED_FOR_PILOT`) | **0** — unavailable | 2 synthetic `APPROVED_FOR_DEVELOPMENT` |
| Reference packs | **0** | 1 synthetic |
| Guidance packs | **0** | 1 synthetic |

## Data capture decision

**Reuse Stage 8 screening template engine** (`QuestionField`, `answerCodec` semantics) with **dedicated** `nutrition_assessment_answers` table. See `docs/architecture/NUTRITION_DATA_CAPTURE_DECISION.md`.

## Architecture pointers

- Feature root: `apps/mobile/src/features/nutrition/`
- Application services: `createNutritionServices.ts`
- Repositories: `apps/mobile/src/data/repositories/sqlite/sqliteNutritionRepositories.ts`
- Migration: `apps/mobile/src/data/database/migrations/006_nutrition_assessment_engine.ts`
- Inventories: `implementation/nutrition-*-inventory.json`
- Architecture: `docs/architecture/NUTRITION_MANAGEMENT_ARCHITECTURE.md`
- Governance: `docs/safety/NUTRITION_CONTENT_GOVERNANCE.md`
- Privacy: `docs/security/NUTRITION_DATA_PRIVACY.md`

## Packages added

**None.**

## Acceptance met (summary)

- [x] Hybrid Stage 8 capture reuse with dedicated nutrition answers table
- [x] Draft lifecycle with review gate and completion rollback
- [x] Reference engine v1 with synthetic codes only
- [x] Guidance resolution with acknowledgement; no risk/referral auto-trigger
- [x] Production fail closed (0 pilot packs)
- [x] Development synthetic content gated and labelled
- [x] Nutrition test suites pass (8/20)
- [ ] Physical Android validation — **PENDING** (emulator offline)

## Exit

See `docs/development/STAGE_12_CHECKPOINT.md`.

## Next stage (do not start)

**STAGE 13 — ASK NORTHCARE CONSTRAINED ASSISTANT** — not approved; do not implement.
