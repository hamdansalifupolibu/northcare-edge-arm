# Local Database Diagnostics

**Stage:** 6  
**Last updated:** 2026-08-02  

## Route

`/(development)/database-preview`

Production gated via `evaluateRouteAccess('development-only')` / `diagnosticsEnabled`.

## Capabilities

- Show readiness, schema version, applied migrations, table names
- Aggregate synthetic record counts (no raw health records)
- Seed SYNTHETIC fixtures
- Run repository self-check
- Reset synthetic database with confirmation

## Reset policy

- Development/test only
- Confirmation required
- Reapplies migrations
- Does **not** clear SecureStore
- Does **not** alter authorised session unless explicitly selected elsewhere
