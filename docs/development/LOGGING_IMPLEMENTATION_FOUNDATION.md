# Logging Implementation Foundation

**Stage:** 2  
**Module:** `apps/mobile/src/logging/logger.ts`  

## Purpose

Provide a lightweight, replaceable, privacy-safe logging abstraction for NorthCare AI.

## API

- `debug(message, meta?)`
- `info(message, meta?)`
- `warn(message, meta?)`
- `error(message, meta?)`

## Privacy rules

The logger must:

- Be environment-aware (debug mostly in development; production minimal)
- Avoid printing secrets, auth values, client identifiers, and health information
- Avoid serialising arbitrary objects blindly
- Support sanitised metadata only

Sensitive key patterns are redacted to `[REDACTED]` (examples: token, password, auth, patient, diagnosis, phone, email).

Arrays are summarised as `[array:N]` rather than expanded.

## Stage 2 behaviour

- Console output is used behind the abstraction
- No external analytics or crash-reporting service is connected
- Production `debug`/`info` output is suppressed or minimal

## Tests

See `apps/mobile/src/__tests__/logger.test.ts`.

## Future replacement

The sink can later be swapped for a privacy-reviewed crash/reporting provider without changing call sites.
