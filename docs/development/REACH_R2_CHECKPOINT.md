# Reach Stage R2 Checkpoint — Community Request Backend and Deterministic Routing

**Stage:** Reach R2 — Community Request Backend and Deterministic Routing  
**Status:** COMPLETE — READY FOR R3 APPROVAL  
**Date:** 2026-08-03  
**Scope approved:** Yes (explicit R2 implementation prompt)

## Checkpoint fields

| Field | Result |
|---|---|
| Stage | Reach R2 — Community Request Backend and Deterministic Routing |
| Status | COMPLETE — READY FOR R3 APPROVAL |
| Stage 19 status | **Paused** until Reach R6 + manual validation |
| Environment preflight | Recorded; portable PostgreSQL up; Alembic was `0004`; demo dual-role profile CHO + both flags true; R0 validate OK; mobile 377/86; Expo Doctor 20/20; backend 110 baseline before R2 |
| Reach demo gate | `NORTHCARE_REACH_DEMO_ENABLED` default false; staging/production fail closed |
| Community request table | `community_requests` |
| Migration revision | `0005` (revises `0004`) |
| Alembic head | `0005` |
| Fresh-migration result | Pass |
| Upgrade from R1 (`0004` → `0005`) | Pass; accounts/roles/profiles preserved |
| Reference code format | `NCR-` + 8 Crockford-like chars; secure random; unique + collision retry |
| Status PIN | 6 digits; leading zeroes preserved; Argon2id verifier; returned once on create |
| Public create | `POST /v1/reach/requests` (gated) |
| Public status | `POST /v1/reach/requests/status` (gated); generic labels only |
| Demo org/facility | Server-controlled `org-dev-001` / `fac-dev-001` |
| Deterministic routing | Frozen matrix from `community-request-routing-matrix.json` |
| No-match behaviour | `received`, unassigned, facility queue |
| Worker APIs | list/detail/acknowledge/contact-attempt/escalate/handle |
| Cancellation endpoint | Not implemented (not in R0 API contract); enum retained |
| Optimistic concurrency | `expectedVersion` on mutations |
| Concurrent claim | Prevented (row lock + version / assignment checks) |
| Abuse control | `failed_status_lookup_count` + `status_lookup_locked_until` |
| Audit / logging | Sanitised; no PIN, verifier, contact, or landmark |
| OpenAPI result | Regenerated — **32** paths |
| R0 artifact-validation result | Pass |
| Mobile feature code | **None** |
| Packages installed | **None** (reused existing Argon2) |
| Mobile type-check result | Pass (`npm run typecheck`) |
| Mobile lint result | Pre-existing `ClientRegisterScreen` react-hooks error (not introduced by R2) |
| Mobile test result | **377** passed / **86** suites |
| Expo Doctor result | **20/20** |
| Python type-check result | mypy pass (59 source files) |
| Python lint result | ruff pass |
| Backend test result | **150** passed |
| PostgreSQL integration result | Pass |
| Migration-test result | Pass (head `0005`) |
| Security-test result | Pass (Reach gate + public/worker controls) |
| Failure-injection result | Pass |
| Known limitations | No USSD simulator; no Worker Community Requests mobile UI; demo facility scope only; six-digit PIN entropy bounded by gate + lockout; Stage 18 device/path blockers unchanged |
| R3 implementation status | **Not started** |
| Stage 19 paused | **Yes** |
| Git status | No commit created (approval required) |
| Recommended R3 scope | Static FastAPI-served USSD simulator under `services/api/static/reach-simulator/` calling R2 public APIs |
| Approval required | Yes — human approval before Reach **R3**. Do not start R3 or Stage 19 automatically |

### Do not print

- Password  
- Password verifier  
- Access token  
- Reset token  
- Status PIN  
- Status PIN verifier  
- Contact numbers  

## Files created (representative)

### Backend

- `services/api/alembic/versions/0005_community_requests.py`
- `services/api/src/northcare_api/reach/` (`enums`, `errors`, `reference`, `status_pin`, `routing`, `transitions`, `validation`, `schemas`, `service`, `routes_public`, `routes_worker`)
- Reach tests under `services/api/tests/integration/test_reach_*.py`, `tests/security/test_reach_security.py`, `tests/helpers_reach.py`

### Documentation / artifacts

- `docs/development/stages/REACH_R2_COMMUNITY_REQUEST_BACKEND.md`
- `docs/development/REACH_R2_CHECKPOINT.md` (this file)
- `docs/development/NORTHCARE_REACH_LOCAL_CONFIGURATION.md`
- `docs/security/NORTHCARE_REACH_STATUS_PIN_SECURITY.md`
- `docs/security/NORTHCARE_REACH_SERVER_AUTHORISATION.md`
- `docs/testing/REACH_R2_TEST_STRATEGY.md`
- `docs/testing/REACH_R2_FAILURE_INJECTION.md`
- `implementation/community-request-schema.json`

## Files modified (representative)

- `services/api/src/northcare_api/config.py`, `main.py`, `domain/models.py`
- `services/api/tests/migration/test_alembic.py`, `tests/contract/test_protocol_contract.py`, `tests/conftest.py`
- `implementation/openapi.json`, `backend-data-model.json`, `reach-roadmap.json`, `implementation-roadmap.json`, `reach-api-contract-draft.json`, `community-request-schema-draft.json`
- `PROJECT_STATUS.md`, `README.md`, `services/api/README.md`, Reach architecture/privacy/public-endpoint/demo docs

## Quality-gate exact counts

| Gate | Result |
|---|---|
| R0 artifact validation | OK — 7 Reach artifacts + implementation-roadmap reachExtension |
| Backend mypy | Success — 59 source files |
| Backend ruff | All checks passed |
| Backend pytest | **150** passed / **0** failed |
| Mobile typecheck | Pass |
| Mobile lint | 1 pre-existing error (`ClientRegisterScreen`), 2 warnings |
| Mobile Jest | **377** passed / **86** suites |
| Expo Doctor | **20/20** |
| OpenAPI paths | **32** |
| Alembic head | **0005** |
| Runtime packages added | **0** |

## Confirmation

- No USSD simulator implemented  
- No Worker Community Requests mobile screens / nav / badges / notifications  
- No R3 started  
- Stage 19 remains paused  
- No git commit created without approval  

## Recommended R3 work

Build the static FastAPI-served Reach USSD simulator that submits synthetic requests to R2 public APIs and performs privacy-safe status checks, with clear simulation labelling.
