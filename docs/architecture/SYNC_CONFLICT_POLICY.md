# Sync Conflict Policy

**Stage:** 14  
**Protocol:** v1  
**Authority:** Server for shared records; local-first for unsynced work  
**Test strategy:** `docs/testing/SYNC_CONFLICT_TEST_STRATEGY.md`  
**Validated:** 2026-08-02 (PostgreSQL conflict create/resolve + mobile dirty-local conflict; no silent LWW)

## Principles

1. Never silently discard unsynced clinical work.
2. Never silently overwrite newer server data.
3. No blind last-write-wins for clinical records.
4. No automatic medical merge.
5. Conflicts are persisted and resolved under worker/admin control according to conflict class.

## Conflict classes

| Class | Behaviour |
|---|---|
| `serverAuthoritative` | Server snapshot wins for shared state; diverging local write becomes an open conflict for review. Local unsynced work is not deleted. |
| `appendOnly` | Distinct entity IDs append without collision. Conflicting updates to the same ID persist as conflicts. |
| `versionedCompletedClinical` | `baseServerVersion` must match. Stale bases → conflict. Resolution is explicit choose-server or keep-local-for-review. No auto merge. |
| `editableDemographicDraft` | Worker may confirm choose-local, choose-server, or keep-for-review for demographic draft fields only. |
| `versionedRecord` | Version check required; controlled resolution only. |

## Detection

- Push with stale `baseServerVersion`
- Pull apply when local pending diverges from server change
- Idempotency hash mismatch (rejected, not auto-merged)

## Persistence

- Server: `sync_conflicts`
- Mobile: local `sync_conflicts` (schema v8+) for Sync Centre

## Resolution API

`POST /v1/sync/conflicts/{conflictId}/resolve` with an explicit resolution action. Clinical classes must not accept opaque “merge” payloads that invent field-level medical merges.
