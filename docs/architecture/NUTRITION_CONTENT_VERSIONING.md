# Nutrition Content Versioning

**Stage:** 12  
**Date:** 2026-08-02

## Version dimensions

| Dimension | Stored on | Notes |
|---|---|---|
| Template | `nutrition_assessments.template_id` + `template_version` | Frozen at assessment start |
| Reference pack | `nutrition_reference_results.reference_pack_id` + `reference_pack_version` | Persisted at complete |
| Guidance pack | `nutrition_guidance_resolutions.guidance_pack_id` + `guidance_pack_version` | Persisted at complete |
| Reference engine | `nutrition_reference_results.engine_version` | Constant `1` for Stage 12 |
| Assessment engine | `nutrition_assessments.engine_version` | Tracks workflow engine generation |

## Content statuses

`DRAFT`, `REVIEW_REQUIRED`, `APPROVED_FOR_DEVELOPMENT`, `APPROVED_FOR_PILOT`, `RETIRED`

Registry load rules (`content/registry.ts`):

- **Production / staging:** `APPROVED_FOR_PILOT` only
- **Development:** `APPROVED_FOR_DEVELOPMENT` + `APPROVED_FOR_PILOT`

## Historical resolution

`getTemplateForPersistedAssessment()` reads from full registered list (including retired) so completed assessments remain viewable. New starts only use environment-loadable packs.

## Supersession

Correction flow creates a new assessment row with `supersedes_id` / `superseded_by_id`. Prior reference and guidance results marked superseded via repository updates and audit events.

## Inventories

Machine-readable manifests:

- `implementation/nutrition-content-inventory.json`
- `implementation/nutrition-reference-pack-inventory.json`
- `implementation/nutrition-guidance-pack-inventory.json`

## Pilot readiness

All production-facing counts are **0** until clinical review registers `APPROVED_FOR_PILOT` packs. Do not invent review names or dates.
