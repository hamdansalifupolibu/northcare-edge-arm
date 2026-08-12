# Stage 18 — Logging and Audit Review

**Updated:** 2026-08-02

## Mobile

- Logger: `apps/mobile/src/logging/logger.ts` with aggressive key redaction (`password`, `token`, `pin`, clinical terms, URIs, etc.).
- Production suppresses debug/info console noise.
- Error boundary logs error name/message slice and stack length only — no clinical payloads.

## Backend

- `RedactingFilter` masks sensitive log records.
- Source scan test prohibits obvious password/token/payload logging.
- Administration writes structured audit events (metadata), not clinical chart contents.

## Verified absences (automated)

- Passwords / PINs / access tokens not logged in unit tests covering logger + feature privacy suites
- Clinical payloads absent from intentional backend request logging patterns

## Residual

- Developers must not `console.log` raw forms during debugging on devices with real data (synthetic only today).
