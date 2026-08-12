# Nutrition Content Governance

**Stage:** 12  
**Date:** 2026-08-02

## Principles

1. **No fabricated clinical nutrition claims** — synthetic development content is explicitly labelled.
2. **Fail closed in production** — zero `APPROVED_FOR_PILOT` templates, reference packs, or guidance packs.
3. **Provenance required for pilot** — `clinicalSourceRef` must link to reviewed registry entries before pilot promotion.
4. **Separate capture from guidance** — templates capture facts; packs provide interpretation and cards.

## Status ladder

```text
DRAFT → REVIEW_REQUIRED → APPROVED_FOR_DEVELOPMENT → APPROVED_FOR_PILOT → RETIRED
```

Stage 12 ships only `APPROVED_FOR_DEVELOPMENT` synthetic content.

## Environment gates

| Environment | Loadable statuses |
|---|---|
| production / staging | `APPROVED_FOR_PILOT` only |
| development | `APPROVED_FOR_DEVELOPMENT`, `APPROVED_FOR_PILOT` |

## UI labelling

- `DevelopmentBanner` on screens when content is development-only
- `NutritionGuidanceUnavailableState` when packs unavailable
- Template `developmentBanner` string on assessment flows

## Forbidden in content

- Diagnosis or malnutrition classification labels in synthetic packs
- Medication, supplement dosage, or therapeutic feeding orders
- Dagbanli text without translation review pipeline

## Registry

`implementation/clinical-source-registry.json` — synthetic sources marked `review_status: NOT_CLINICAL`, `authority: null`.

## Tests

`contentGovernance.test.ts` — pilot counts, production fail-closed, development load rules.

## Outstanding

- Pilot-ready clinical nutrition templates, reference tables, and guidance cards — **not registered**
- Professional health review — **not completed**
