# Auth Identifier Decision

**Stage:** 5  
**Last updated:** 2026-08-02  
**Status:** Provisional — backend mapping deferred

## Decision

| Layer | Choice |
|---|---|
| Domain field | `loginIdentifier` (neutral) |
| Worker/admin UI label | **Assigned worker ID or work email** (Stitch-aligned wording) |
| Backend mapping | Deferred until Firebase / account service is provisioned |

## Rationale

Stitch login screens and product docs do not yet mandate a single identifier type for all frontline workers. Forcing every worker to have a personal email is not confirmed. A neutral domain term keeps the remote provider free to map:

- assigned worker ID → remote account
- work email → remote account
- or both

without changing the mobile domain model.

## Development provider behaviour

`DevelopmentAuthProvider` currently matches synthetic `accountId` or display name (case-insensitive). This is prototype-only and must not define production identity rules.

## Open questions (deferred)

1. Canonical production identifier (worker ID vs email vs either)
2. Normalisation rules (case, whitespace, country code)
3. Whether administrators use a different identifier type
4. Recovery channel linkage to the same identifier

## Non-goals (Stage 5)

- Inventing a final identity scheme
- Building public registration around email
- Storing multiple identifier types in SecureStore beyond account metadata already on the session envelope
