# Client Management Test Strategy

**Stage:** 7  

## Approach

Isolated in-memory SQLite via `createTestDatabase()`. No production data. No network.

## Suites

| Area | Location |
|---|---|
| Duplicate rules | `src/features/clients/__tests__/duplicateDetection.test.ts` |
| Reference codes | `src/features/clients/__tests__/clientReferenceCode.test.ts` |
| Validation / consent default | `src/features/clients/__tests__/clientValidation.test.ts` |
| Register/search/edit/archive/rollback | `src/features/clients/__tests__/clientServices.test.ts` |
| Route security | `src/features/clients/__tests__/clientSecurity.test.ts` |
| Schema migration v2 | `src/data/__tests__/migrations.test.ts` |
| Non-device performance | `src/data/__tests__/performanceBaseline.test.ts` |

## Transaction rollback

Registration forces a sync-queue failure after earlier steps and asserts no partial client remains.
