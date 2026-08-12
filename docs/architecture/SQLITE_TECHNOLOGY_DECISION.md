# SQLite Technology Decision

**Stage:** 6  
**Last updated:** 2026-08-02  
**Status:** Accepted for competition MVP  

## Decision

Use **Expo SQLite** (`expo-sqlite` ~57.0.1) with the current async API (`openDatabaseAsync`, `runAsync`, `getAllAsync`, `withTransactionAsync`).

Do **not** use the deprecated WebSQL-style API.

## Alternatives considered

| Option | Verdict |
|---|---|
| Expo SQLite | **Selected** — SDK 57 supported, Expo Go compatible, no custom native module |
| TypeORM / Sequelize / Prisma / Drizzle | Rejected — ORM complexity not justified for Stage 6 timeline |
| Realm / WatermelonDB | Rejected — heavier sync-oriented stacks; sync networking is out of scope |
| SQLCipher via Expo plugin | Deferred — encryption requires separate security decision (see `LOCAL_DATABASE_SECURITY.md`) |

## Implementation approach

- Explicit SQL migrations (versioned registry)
- Typed repository interfaces + SQLite implementations
- Prepared / bound statements only (no string-concatenated user data)
- Thin `SqliteDriver` abstraction for Expo runtime and Node test driver
- No ORM

## Resolved package

| Package | Version |
|---|---|
| `expo-sqlite` | ~57.0.1 |

Installed with: `npx expo install expo-sqlite -- --legacy-peer-deps`

## WAL

`PRAGMA journal_mode = WAL` is enabled for on-disk databases (not in-memory test DBs). Documented Expo guidance recommends WAL for general performance. Device validation remains pending while the emulator is offline.
