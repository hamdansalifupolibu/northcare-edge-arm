# Nutrition Development Content

**Stage:** 12  
**Date:** 2026-08-02

## Summary

Stage 12 ships **synthetic development-only** nutrition content. Production and staging load **zero** pilot-approved packs.

## Counts

| Content type | `APPROVED_FOR_PILOT` | `APPROVED_FOR_DEVELOPMENT` |
|---|---|---|
| Assessment templates | **0** | **2** (child + maternal) |
| Reference packs | **0** | **1** |
| Guidance packs | **0** | **1** |

## Template files

| File | templateId |
|---|---|
| `content/assessments/syntheticDevChildNutritionTemplate.ts` | `synthetic-dev-child-nutrition-v1` |
| `content/assessments/syntheticDevMaternalNutritionTemplate.ts` | `synthetic-dev-maternal-nutrition-v1` |

## Reference pack

`content/references/syntheticDevNutritionReferencePack.ts` — `synthetic-dev-nutrition-reference-v1`

Interpretation codes: `developmentCategoryA`, `developmentCategoryB` only.

## Guidance pack

`content/guidance/syntheticDevNutritionGuidancePack.ts` — `synthetic-dev-nutrition-guidance-v1`

Cards: `development-guidance-card-d`, `development-guidance-card-e`

## Registry API

`content/registry.ts` — environment-filtered loaders + inventory counters used by preview screen and tests.

## Preview route

Development only: `/(development)/nutrition-preview`

## Promoting to pilot

Requires:

1. Clinical source registration in `implementation/clinical-source-registry.json`
2. Health professional review (names/dates **not** recorded until real review occurs)
3. Status change to `APPROVED_FOR_PILOT` on each artifact
4. Updated inventories and governance docs

Do not invent review metadata.

## Inventories

- `implementation/nutrition-content-inventory.json`
- `implementation/nutrition-reference-pack-inventory.json`
- `implementation/nutrition-guidance-pack-inventory.json`
