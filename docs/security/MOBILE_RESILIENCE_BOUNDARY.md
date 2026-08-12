# Mobile Resilience Boundary (Stage 18)

**Updated:** 2026-08-02

## In scope

- Local-first writes survive temporary network loss
- Sync does not discard dirty records on conflict (review path)
- AppErrorBoundary shows calm non-sensitive recovery UI
- Migrations applied via MigrationRunner with version registry
- Notification scheduling fails closed in Expo Go (lazy gate)

## Out of scope / not claimed

- Full offline multi-week conflict-free operation under all OEM battery modes
- Anti-tamper / root detection SDKs
- Guaranteed background sync
- Perfect recovery after arbitrary process kill mid-write without SQLite durability assumptions

## Failure injection

See `docs/testing/STAGE_18_FAILURE_INJECTION.md`.
