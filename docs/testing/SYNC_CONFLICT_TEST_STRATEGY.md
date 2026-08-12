# Sync Conflict Test Strategy

## Server

PostgreSQL-backed tests cover:

- stale `baseServerVersion` → `conflict` / `STALE_BASE_VERSION`
- create-when-exists
- update-after-delete / delete-after-update stale bases
- resolve `chooseServer` and `keepForReview`
- no silent last-write-wins (two-device simulation)

Files: `tests/integration/test_conflicts_api.py`, `test_postgres_behaviours.py` (pg_11/12), scripted two-device simulation.

## Mobile

- Dirty local queue item → open conflict; local row not overwritten (`entityApplicators.test.ts`)
- Conflicts persist until explicit resolution (`syncConflictPersistence.test.ts`)

## Intentionally not auto-merged

Completed clinical classes remap `chooseLocal` → `keepForReview` on the server. Manual clinical field merge is out of scope.
