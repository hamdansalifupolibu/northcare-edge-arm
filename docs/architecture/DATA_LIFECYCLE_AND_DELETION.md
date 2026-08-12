# Data Lifecycle and Deletion

**Stage:** 6  
**Last updated:** 2026-08-02  

## Soft delete (default for clinical entities)

Deleted records retain:

- ID
- `deleted_at`
- incremented `local_version`
- `sync_status` (typically `pendingDelete`)
- audit potential via separate audit events

Normal repository queries exclude soft-deleted rows. Explicit `includeDeleted` options exist for authorised diagnostics.

## Hard delete (limited)

Allowed only for:

- Development database reset
- Synthetic fixtures / test cleanup
- Failed uncommitted drafts where a future policy permits

Permanent deletion of clinical records in production requires an approved retention policy (not Stage 6).

## SecureStore independence

Database reset must not silently clear SecureStore session or PIN material.
