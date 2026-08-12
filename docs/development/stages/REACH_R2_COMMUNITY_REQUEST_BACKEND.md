# Reach Stage R2 — Community Request Backend and Deterministic Routing

**Status:** Complete — awaiting R3 approval  
**Date:** 2026-08-03  
**Depends on:** Reach R0, Reach R1  
**Does not include:** USSD simulator (R3), Worker Community Requests Centre UI (R4), Stage 19

## Purpose

Server-side foundation for synthetic NorthCare Reach community requests:

1. Public create (development gate)  
2. Reference code + one-time six-digit status PIN (Argon2id verifier)  
3. Deterministic worker assignment from the R0 routing matrix  
4. Facility queue when no eligible worker matches  
5. Authorised worker list/detail/lifecycle APIs  
6. Privacy-safe public status lookup  

## Development gate

`NORTHCARE_REACH_DEMO_ENABLED` (default `false`):

- May be `true` only when `NORTHCARE_ENV` is `development` or `test`  
- Staging/production configuration with the flag enabled fails closed at settings load  
- Public and worker Reach APIs return `reachDemoDisabled` when the gate is off  

See `docs/development/NORTHCARE_REACH_LOCAL_CONFIGURATION.md`.

## Persistence

- Table: `community_requests`  
- Alembic revision: `0005` (revises `0004`)  
- No raw PIN column  
- Internal security fields: `failed_status_lookup_count`, `status_lookup_locked_until`  

## Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/v1/reach/requests` | Public (gate) |
| POST | `/v1/reach/requests/status` | Public (gate) |
| GET | `/v1/worker/community-requests` | Worker |
| GET | `/v1/worker/community-requests/{requestId}` | Worker |
| POST | `.../acknowledge` | Worker |
| POST | `.../contact-attempt` | Worker |
| POST | `.../escalate` | Worker |
| POST | `.../handle` | Worker |

Cancellation remains an enum value only — no cancel endpoint in the R0 API contract.

## Demo scope

Organisation `org-dev-001`, facility `fac-dev-001` — server-controlled; public callers cannot choose them.

## Explicit non-goals

USSD UI, mobile screens/nav/badges, SMS/telecom/ambulance, AI triage, geocoding, Redis/brokers/queues/WebSockets, R3, Stage 19.
