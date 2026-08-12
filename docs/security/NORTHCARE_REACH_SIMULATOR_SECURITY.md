# NorthCare Reach — Simulator Security (R3)

**Status:** Implemented with Reach Stage R3  
**Last updated:** 2026-08-03

## Scope

Security controls for the development-only USSD simulator at `GET /reach-simulator`.

## Gate

- Served only when `NORTHCARE_REACH_DEMO_ENABLED` is true and `NORTHCARE_ENV` is `development` or `test`
- Staging/production cannot enable the Reach demo flag (settings fail closed)
- When disabled, simulator routes return `403` with `reachDemoDisabled`

## Static serving

- Allow-list only: `index.html`, `reach.css`, `reach.js`
- No directory listing
- No path traversal to source or configuration
- Response headers: `nosniff`, `DENY` framing, `no-store`, restrictive CSP (`default-src 'none'` plus self script/style/connect)

## Browser storage

Do not use `localStorage`, `sessionStorage`, cookies, or IndexedDB for contact numbers, community, reference codes, status PINs, consent, or request history.

## Logging

Do not console-log request payloads, PINs, contact numbers, reference codes, or status bodies.

## PIN handling

Status PIN is returned once by R2, shown on screen, held only in memory for the session, cleared on restart/reload. Not placed in URLs or auto-copied.

## Related

- `docs/security/NORTHCARE_REACH_PUBLIC_ENDPOINT_BOUNDARY.md`
- `docs/security/NORTHCARE_REACH_STATUS_PIN_SECURITY.md`
- `docs/security/NORTHCARE_REACH_PRIVACY_BOUNDARY.md`
