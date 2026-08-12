# Client Reference Code

**Status:** PROVISIONAL — REVIEW BEFORE PILOT DEPLOYMENT  
**Stage:** 7  

## Decision

Local client reference codes use:

```text
NC-XXXXXX
```

where `XXXXXX` is the last six hexadecimal characters of the client UUID (hyphens removed), uppercased.

## Properties

- Stable after creation
- Unique on the device (UUID-backed; short-code collision regenerates once)
- Human-readable
- Not derived from name, phone, date of birth, or clinical data
- Does not change after synchronisation (sync is not implemented yet)

## Non-goals

This is **not** a national patient identifier and must not be presented as one.
