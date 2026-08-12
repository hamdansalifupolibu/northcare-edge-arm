# Nutrition Data Privacy

**Stage:** 12  
**Date:** 2026-08-02

## Classification

Nutrition data is **SENSITIVE HEALTH DATA** (see `docs/security/DATA_CLASSIFICATION.md`).

Includes: assessment answers, measurements links, reference results, guidance acknowledgements, follow-up dates.

## Storage

- Structured fields in SQLite (`nutrition_*` tables)
- Auth-gated routes — no pre-authentication exposure
- Repositories only — screens do not execute raw SQL

## Logging prohibitions

Do **not** log:

- Answer values or question responses
- Interpretation codes tied to identifiable clients in production diagnostics
- Full assessment payloads
- Caregiver-facing guidance text in crash reports

## Route privacy

Paths use UUIDs only (`clientId`, `assessmentId`, `sectionId`) — never names, symptoms, or answers in URLs.

## Sync

Stage 12: local-only writes (`sync_status: localOnly`). No network transmission.

## Development preview

`/(development)/nutrition-preview` lists pack inventory counts — gated off production builds.

## Tests

`securityPrivacy.test.ts`

## Related

- `docs/safety/NUTRITION_CONTENT_GOVERNANCE.md`
- `AGENTS.md` privacy rules
