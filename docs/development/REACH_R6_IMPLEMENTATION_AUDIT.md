# Reach R6 — Final R0–R5 Implementation Audit

**Date:** 2026-08-03  
**Rule:** Documentation alone is not “implemented”.

| Capability | Classification | Evidence |
|---|---|---|
| Profession registry | Implemented and automatically tested | `worker-profession-registry.json`, `GET /v1/admin/professions`, profile tests |
| Professional profile | Implemented and automatically tested | Alembic `0004`, admin PATCH/register, CLI profile setup |
| Admin registration integration | Implemented and automatically tested | Admin register profession + enablement fields; API tests; mobile registration flow tests |
| Community-request backend | Implemented and automatically tested | Alembic `0005`, Reach service + routes, pytest suites |
| Request reference | Implemented and automatically tested | Reference generator + create response tests |
| Status PIN | Implemented and automatically tested | Argon2id hash; one-time return on create; never stored raw |
| Public creation endpoint | Implemented and automatically tested | `POST /v1/reach/requests` |
| Public status endpoint | Implemented and automatically tested | `POST /v1/reach/requests/status` — generic label only |
| Profession routing | Implemented and automatically tested | Frozen matrix + `test_reach_routing.py` |
| Worker list endpoint | Implemented and automatically tested | Omits contact numbers |
| Worker detail endpoint | Implemented and automatically tested | Contact in detail; omits PIN fields |
| Acknowledge | Implemented and automatically tested | Worker mutation + concurrency |
| Contact attempt | Implemented and automatically tested | Lifecycle tests |
| Escalate | Implemented and automatically tested | R2 API + R5 mobile UI + R5/R6 journeys |
| Mark handled | Implemented and automatically tested | Lifecycle + routine E2E |
| USSD simulator | Demonstration simulation | Static FastAPI UI; gated; not live telecom |
| Worker Community Requests Centre | Implemented but Android runtime pending | Expo feature + unit tests; physical/native pending |
| Emergency presentation | Implemented but Android runtime pending | Mobile emergency UI + API emergency journey |
| Emergency escalation | Implemented but Android runtime pending | Escalate UI + confirmation wording; API pass |
| Public generic status updates | Implemented and automatically tested | Privacy E2E |
| Live USSD / SMS / telecom | Future expansion | Explicitly out of MVP |
| Ambulance integration | Future expansion | Explicitly out of MVP |
| Remote push / GPS / maps / dispatcher | Future expansion | Explicitly out of MVP |
| Stage 19 E2E release prep | Not applicable (paused) | Intentionally paused |

## Demo packaging (R6)

| Item | Classification |
|---|---|
| `reset_reach_demo` CLI | Implemented and automatically tested (env guards) |
| `seed_reach_demo` CLI | Implemented and automatically tested (env guards) |
| Demo runbook / judge materials | Documentation (supports demonstration; not a runtime feature) |
