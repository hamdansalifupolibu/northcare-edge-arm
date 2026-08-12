# Client Management Architecture

**Stage:** 7  

## Layers

```text
Worker UI (app/(worker)/clients/*)
  → Client screens / components
    → ClientServices (application use cases)
      → Stage 6 repositories
        → SqliteDriver (+ transactions)
```

Screens never execute SQL, import raw SQLite, or write sync-queue rows directly.

## Use cases

| Service method | Responsibility |
|---|---|
| `searchClients` | Local list/search/filter (archived excluded by default) |
| `registerClient` | Transactional create + caregiver + audit + sync enqueue |
| `checkPossibleDuplicates` | Conservative local candidate check |
| `getClientProfile` | Profile + caregivers + sanitised audit history |
| `updateClient` | Versioned update + audit + sync enqueue |
| `archiveClient` | Soft delete + audit + sync enqueue |

## Schema additions (v2)

- Consent statuses: `unknown | recorded | declined | deferred | notApplicable`
- `approximate_age_unit`: `days | weeks | months | years`
- DOB XOR approximate age CHECK

## Offline wording

- Saved on this device
- Waiting for connection
- Needs review

Never show “Synced” unless `syncStatus === 'synced'`. No networking in Stage 7.

## Routes

All under worker-protected `app/(worker)/clients/` using client UUIDs only.
