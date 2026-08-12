# Assistant Development Content

**Stage:** 13  
**Date:** 2026-08-02

## Production gate

| Status | Count |
|---|---|
| `APPROVED_FOR_PILOT` | **0** — production fails closed |
| `APPROVED_FOR_DEVELOPMENT` | **1** |

## Synthetic pack

| Field | Value |
|---|---|
| Pack id | `synthetic-dev-ask-northcare-v1` |
| Version | `1` |
| Status | `APPROVED_FOR_DEVELOPMENT` |
| Clinical | No |
| Path | `apps/mobile/src/features/assistant/content/packs/syntheticDevAskNorthCarePack.ts` |
| Banner | Development Ask NorthCare content — not clinical guidance |

Topics include synthetic care/workflow/reference/app-help examples for retrieval, multi-source, long-answer, and safety-routing tests. Sources are explicitly synthetic — not WHO/UNICEF/GHS.

## Load rules

- Development/test: synthetic pack loadable.
- Staging/production: synthetic pack **not** loadable → assistant unavailable for knowledge answers.

## Preview

`/(development)/ask-northcare-preview` — diagnostics-gated; hidden when `EXPO_PUBLIC_APP_ENV=production`.

## Inventory

`implementation/assistant-knowledge-pack-inventory.json`

## Do not

- Invent clinical review names or pilot approval dates
- Fabricate Dagbanli medical translations
- Promote synthetic articles as caregiver-facing clinical guidance
