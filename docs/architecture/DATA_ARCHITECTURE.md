# Data Architecture

**Stage:** 7  
**Last updated:** 2026-08-02  

## Persistence audit (pre-Stage 6)

| Concern | Finding |
|---|---|
| `expo-sqlite` | Not previously installed — added in Stage 6 |
| Clinical SQLite | None existed |
| Repositories | Auth `SecureSessionRepository`; preferences `AppPreferencesRepository` (AsyncStorage) |
| AsyncStorage clinical data | None — onboarding/workspace only |
| SecureStore | Session envelope + PIN verifier (correctly separated) |
| UUID / date helpers | None — added under `src/data/domain/` |
| Domain models | Auth domain only — clinical domain added in Stage 6 |

## Boundaries

```text
UI / screens
  → application use cases (features/clients)
    → repositories (interfaces)
      → SQLite implementations
        → SqliteDriver (Expo) + transactions
```

Screens must never import `expo-sqlite` or receive a raw connection. Schema version is **2** after Stage 7 consent/age-unit migration.

## Layers

| Layer | Path |
|---|---|
| Connection / migrations | `apps/mobile/src/data/database/` |
| Domain entities / enums | `apps/mobile/src/data/domain/` |
| Repository contracts + SQLite | `apps/mobile/src/data/repositories/` |
| Provider | `apps/mobile/src/data/providers/DatabaseProvider.tsx` |
| Diagnostics | `apps/mobile/src/data/diagnostics/` |
| Synthetic fixtures | `apps/mobile/src/data/fixtures/` |

## Offline-first

Local SQLite is the source of truth for structured records introduced in Stage 6. Sync-queue rows prepare future networking; no network sync is implemented.
