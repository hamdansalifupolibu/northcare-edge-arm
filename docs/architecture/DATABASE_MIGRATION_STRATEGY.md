# Database Migration Strategy

**Stage:** 6  
**Last updated:** 2026-08-02  

## Rules

1. Never silently edit a released migration.
2. Add a new numbered migration for schema changes.
3. Apply migrations in ascending numeric order.
4. Run each migration inside a transaction where supported.
5. On failure, roll back and do **not** record the migration.
6. Persist history in `schema_migrations` (`version`, `name`, `applied_at`, `checksum`).
7. Detect duplicate versions and sequence gaps.
8. Fresh install and repeated init must be tested.

## Runner

`apps/mobile/src/data/database/migrations/MigrationRunner.ts`

## Registry

`apps/mobile/src/data/database/migrations/registry.ts`

## Current migrations

| Version | Name |
|---|---|
| 1 | `001_initial_schema` |

## Destructive reset

Allowed only in development/test via `DatabaseManager.resetForDevelopment` — never as the normal upgrade path.
