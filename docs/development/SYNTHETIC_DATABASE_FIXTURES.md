# Synthetic Database Fixtures

**Stage:** 6  
**Last updated:** 2026-08-02  

## Rules

- Clearly fictional names and identifiers marked **SYNTHETIC**
- No real patients, phones, addresses, credentials, or medical histories
- Never auto-seed production builds

## Availability

- Jest tests
- Development database preview seed action
- `seedSyntheticDatabase()` in `apps/mobile/src/data/fixtures/syntheticSeed.ts`

## Included fixtures

- SYNTHETIC facility
- SYNTHETIC worker local account reference
- SYNTHETIC client + caregiver + relationship
- SYNTHETIC draft encounter
- SYNTHETIC referral
- Sync-queue + audit seed markers
