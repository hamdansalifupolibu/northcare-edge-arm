# Domain Model

**Stage:** 6  
**Last updated:** 2026-08-02  

Domain entities live in `apps/mobile/src/data/domain/entities/entities.ts` and are independent of SQLite row shapes.

## Identifier policy

- Type: `EntityId` (UUID v4 string)
- Generator: `createIdGenerator` / `getIdGenerator` (`expo-crypto`)
- SQLite autoincrement is never the domain ID

## Time policy

- Timestamps: ISO 8601 UTC (`2026-08-02T12:30:00.000Z`)
- Date-only health fields: `YYYY-MM-DD`
- Injectable `Clock` for tests

## Record metadata

`id`, `createdAt`, `updatedAt`, `createdByAccountId`, `updatedByAccountId`, `localVersion`, `serverVersion`, `syncStatus`, `lastSyncedAt`, `deletedAt`, `isDeleted`

## Sync statuses

`localOnly` | `pendingCreate` | `pendingUpdate` | `pendingDelete` | `syncing` | `synced` | `syncFailed` | `conflict` | `needsReview`

## Client categories

`pregnant` | `postnatal` | `newborn` | `childUnderFive`

Category changes update the current field; historical encounters retain their own context. Dedicated category-history table is deferred.

## Soft delete

Normal queries exclude `is_deleted = 1`. Explicit `includeDeleted` options exist where authorised.
