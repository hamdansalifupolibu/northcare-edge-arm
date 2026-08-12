# Screening Template Versioning

**Product:** NorthCare AI  
**Stage:** 8  
**Last reviewed:** 2026-08-02

## Model

Each screening template has:

| Field | Meaning |
|---|---|
| `templateId` | Stable identifier (e.g. `synthetic-dev-workflow-v1`) |
| `version` | Integer schema version persisted on `screenings.schema_version` |
| `status` | Governance status (see below) |
| `screeningType` | Domain screening type enum |

## Governance statuses

| Status | New visits (development/staging) | New visits (production) | Existing visits |
|---|---|---|---|
| `DRAFT` | No | No | N/A |
| `CLINICAL_REVIEW_REQUIRED` | No | No | N/A |
| `APPROVED_FOR_DEVELOPMENT` | Yes | No | Resolve for review/history |
| `APPROVED_FOR_PILOT` | Yes | Yes | Resolve for review/history |
| `RETIRED` | No | No | Resolve for review/history only |

## Rules

1. New visits load only templates allowed for the current app environment.
2. Completed/draft visits keep their original `screeningType` + `schemaVersion`.
3. Retired templates must not be offered for new visits.
4. Template content is code-bundled under `apps/mobile/src/features/screening/content/`.
5. Clinical source provenance is tracked in `implementation/clinical-source-registry.json` — unknown/null is honest.

## Synthetic development pack

`synthetic-dev-workflow-v1` is labelled **DEVELOPMENT WORKFLOW TEMPLATE — NOT CLINICAL GUIDANCE**. It exists for workflow and engine tests only.
