# REACH STAGE R0 — Scope, Safety and Design Freeze

**Status:** Implemented (documentation and contracts only) — awaiting R1 approval  
**Prerequisites:** Stages 1–18 complete; Stage 19 intentionally paused  
**Next stage:** R1 — Worker Profession and Admin Integration (**do not start automatically**)  
**Date:** 2026-08-03  

## Purpose

Define and freeze the NorthCare Reach hackathon MVP before any backend, mobile, simulator, or migration implementation.

## Included in R0

- MVP definition and five connected capabilities  
- Final USSD main menu and all six option flows  
- Emergency, privacy, and safety wording boundaries  
- Request categories, types, statuses, transitions  
- Minimal CommunityRequest model  
- Reference code and status PIN rules  
- Profession enum and separation from system role  
- Admin registration additions (planned for R1)  
- Demo account professional profile freeze  
- Deterministic routing matrix and assignment behaviour  
- Worker Community Requests Centre planned UX  
- Notification and public-endpoint boundaries  
- Draft API contracts (artifact only — not live OpenAPI)  
- Simulator technical decision (static files on FastAPI)  
- Must-build vs future-expansion lists  
- R0–R6 roadmap  
- JSON artifacts + validation  
- Status updates: `PROJECT_STATUS.md`, `README.md`, roadmaps  

## Excluded from R0

- PostgreSQL / SQLite / Alembic migrations  
- FastAPI routes or live OpenAPI regeneration  
- Expo Router screens / UI components / simulator HTML  
- Admin form changes / professional profile provisioning  
- Request fixtures / routing logic / notifications  
- New packages  
- Auth or sync changes  
- Starting R1 or Stage 19  

## Design decisions confirmed

| # | Question | Answer |
|---|---|---|
| 1 | English only implemented simulator language? | Yes |
| 2 | Live telecom included? | No |
| 3 | Live ambulance included? | No |
| 4 | Generative AI in emergency flow? | No |
| 5 | Detailed symptoms collected? | No |
| 6 | USSD request auto-creates client? | No |
| 7 | Ordinary admin registration creates only worker accounts? | Yes |
| 8 | Profession separate from system role? | Yes |
| 9 | Routing deterministic? | Yes |
| 10 | Shifts / workload balancing included? | No |
| 11 | Existing development account is demo responder? | Yes |
| 12 | Status responses privacy safe? | Yes |
| 13 | Stage 19 still paused? | Yes |

## Key deliverables

| Type | Path |
|---|---|
| MVP | `docs/product/NORTHCARE_REACH_MVP.md` |
| USSD flows | `docs/product/NORTHCARE_REACH_USSD_FLOW.md` |
| Architecture | `docs/architecture/NORTHCARE_REACH_ARCHITECTURE.md` |
| Domain | `docs/architecture/COMMUNITY_REQUEST_DOMAIN_MODEL.md` |
| Routing | `docs/architecture/COMMUNITY_REQUEST_ROUTING_POLICY.md` |
| Profession | `docs/architecture/WORKER_PROFESSIONAL_PROFILE.md` |
| Safety | `docs/safety/NORTHCARE_REACH_SAFETY_BOUNDARY.md` |
| Privacy | `docs/security/NORTHCARE_REACH_PRIVACY_BOUNDARY.md` |
| Public API boundary | `docs/security/NORTHCARE_REACH_PUBLIC_ENDPOINT_BOUNDARY.md` |
| Demo account | `docs/development/NORTHCARE_REACH_DEMO_ACCOUNT.md` |
| Future scope | `docs/development/NORTHCARE_REACH_FUTURE_EXPANSION.md` |
| Artifacts | `implementation/reach-*.json`, `community-request-*.json`, `worker-profession-registry.json` |
| Checkpoint | `docs/development/REACH_R0_CHECKPOINT.md` |

## Exit

Checkpoint approved → ready for **R1 approval**. Do not auto-start R1 or Stage 19.
