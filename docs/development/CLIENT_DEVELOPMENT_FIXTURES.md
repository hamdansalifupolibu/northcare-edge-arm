# Client Development Fixtures

**Stage:** 7  

## Source

Synthetic seed: `apps/mobile/src/data/fixtures/syntheticSeed.ts`

## Rules

- SYNTHETIC names/phones only
- Never auto-seed production
- Database preview seed/reset gated by environment
- Counts shown in diagnostics are aggregates — records are not dumped

## Diagnostics extensions

Database preview shows:

- Table/entity counts
- Schema version / migrations
- Pending sync-queue item count
