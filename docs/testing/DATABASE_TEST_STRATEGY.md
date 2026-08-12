# Database Test Strategy

**Stage:** 6  
**Last updated:** 2026-08-02  

## Approach

- Production driver: Expo SQLite
- Jest driver: Node built-in `node:sqlite` via `createNodeSqliteDriver` (requires `--experimental-sqlite`)
- Shared repositories/migrations run against the `SqliteDriver` interface

## Suites

| Suite | Coverage |
|---|---|
| `migrations.test.ts` | Fresh migrate, repeat init, duplicates, rollback, FK, unique, indexes, reset, upgrade path |
| `repositoryContracts.test.ts` | Client, Encounter, Screening, Referral, SyncQueue, Audit + transaction rollback |
| `privacyAndIds.test.ts` | UUID uniqueness, date helpers, log redaction |
| `performanceBaseline.test.ts` | Non-device Node timings only |

## Commands

```bash
cd apps/mobile
npm test
```

## Android

Device/emulator SQLite runtime validation is separate and currently blocked when `adb devices` shows emulator offline.
