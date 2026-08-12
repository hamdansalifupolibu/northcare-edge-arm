# Reach Stage R0 Checkpoint — Scope, Safety and Design Freeze

**Stage:** Reach R0  
**Status:** COMPLETE — READY FOR R1 APPROVAL  
**Date:** 2026-08-03  
**Scope approved:** Yes (explicit R0 implementation prompt)

## Checkpoint fields

| Field | Result |
|---|---|
| Stage | Reach R0 — Scope, Safety and Design Freeze |
| Status | COMPLETE — READY FOR R1 APPROVAL |
| Current application stage | Stages 1–18 complete |
| Stage 19 status | **Paused** until Reach R6 + manual validation |
| Reach MVP summary | Simulated USSD → community request → profession routing → worker Community Requests Centre → privacy-safe status check; telecom/ambulance simulated |
| USSD menu result | Frozen 0–6 main menu; no extra options |
| Emergency flow result | 112-first; options end/call, urgent review, CHPS callback; simulation confirmation; no medical grading |
| Pregnancy/newborn flow result | Submenu 1–6 + 0/9; placeholders labelled unapproved; option 6 → `pregnancyNewborn` |
| Child-health flow result | Submenu 1–6 + 0/9; no classification/meds/risk; option 6 → `childHealth` |
| Nutrition flow result | Submenu 1–6 + 0/9; no anthropometry/treatment; option 6 → `nutrition` |
| CHPS request flow result | Reason → landmark → phone → consent → reference + PIN; no auto client |
| Request-status flow result | Reference + PIN; generic public labels only |
| Language flow result | English implemented; others planned; no fabricated/AI translation |
| Implemented language decision | English only |
| Request categories | pregnancyNewborn, childHealth, nutrition, generalChps, referralFollowUp, emergency |
| Request types | routine, urgentContact, emergencyAssistance |
| Request statuses | received, assigned, acknowledged, contactAttempted, escalated, handled, cancelled |
| Status-transition result | Primary + escalated alternate + cancel from received/assigned/acknowledged; handled/cancelled terminal |
| Community request model | Minimal fields frozen; symptoms/GPS/clinical/PII extras excluded |
| Reference-code decision | Human-readable; not derived from phone/client/DOB; not easy sequential enumeration |
| Status-PIN decision | Six digits; shown once; hash/verifier only; never logged/returned later |
| Profession registry | Eight controlled professions; optional description only for otherApprovedHealthProfessional |
| Profession versus role result | Separate; ordinary admin registration creates worker only |
| Admin registration additions | profession, communityRequestsEnabled, emergencyRequestsEnabled (R1) |
| Development account professional profile | communityHealthOfficer; community + emergency enabled; no password documented |
| Routing matrix | Deterministic preference lists per category; fac-dev-001 / org-dev-001 |
| No-match routing result | Remain `received` in facility queue; never discard |
| Worker request actions | Acknowledge, contact attempt, escalate, mark handled, start client lookup |
| Emergency worker actions | Prominent privacy-safe UI; requires emergencyRequestsEnabled; simulation label |
| Notification boundary | No remote push; refresh on open/foreground/manual; generic post-fetch feedback only |
| Simulator technical decision | Static files under FastAPI `services/api/static/reach-simulator/` (R3) |
| Public-endpoint boundary | Draft only; rate limit/abuse/PIN hash requirements documented |
| Safety boundary | No diagnose/prescribe/dosage/AI emergency/auto client/ambulance claims |
| Privacy boundary | Minimal collection; public status generic; PIN protected |
| Must-build features | Documented in MVP + reach-roadmap |
| Future features | Documented; not in R1–R6 without approval |
| R1–R6 roadmap | Frozen in reach-roadmap.json |
| Stage 19 paused | Yes |
| JSON validation result | Pass (`python scripts/validate_reach_r0_artifacts.py`) |
| Tests or validation commands | `python scripts/validate_reach_r0_artifacts.py` |
| Packages installed | None |
| Implementation code changed | No |
| Database migrations created | No |
| Git status | No commit created (approval required) |

## Design decisions (section 38)

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

## Files created

### Documentation

- `docs/product/NORTHCARE_REACH_MVP.md`
- `docs/product/NORTHCARE_REACH_USSD_FLOW.md`
- `docs/architecture/NORTHCARE_REACH_ARCHITECTURE.md`
- `docs/architecture/COMMUNITY_REQUEST_DOMAIN_MODEL.md`
- `docs/architecture/COMMUNITY_REQUEST_ROUTING_POLICY.md`
- `docs/architecture/WORKER_PROFESSIONAL_PROFILE.md`
- `docs/safety/NORTHCARE_REACH_SAFETY_BOUNDARY.md`
- `docs/security/NORTHCARE_REACH_PRIVACY_BOUNDARY.md`
- `docs/security/NORTHCARE_REACH_PUBLIC_ENDPOINT_BOUNDARY.md`
- `docs/development/NORTHCARE_REACH_DEMO_ACCOUNT.md`
- `docs/development/NORTHCARE_REACH_FUTURE_EXPANSION.md`
- `docs/development/stages/REACH_R0_SCOPE_FREEZE.md`
- `docs/development/REACH_R0_CHECKPOINT.md` (this file)

### Artifacts / scripts

- `implementation/reach-ussd-flow.json`
- `implementation/community-request-schema-draft.json`
- `implementation/community-request-statuses.json`
- `implementation/community-request-routing-matrix.json`
- `implementation/worker-profession-registry.json`
- `implementation/reach-api-contract-draft.json`
- `implementation/reach-roadmap.json`
- `scripts/validate_reach_r0_artifacts.py`

## Files modified

- `PROJECT_STATUS.md`
- `README.md`
- `docs/README.md`
- `docs/development/IMPLEMENTATION_HANDOFF.md`
- `scripts/README.md`
- `implementation/implementation-roadmap.json` (S19 → paused; reachExtension added)

## Explicitly not modified

- `implementation/openapi.json`
- `apps/mobile/**` application code
- `services/api/**` application code
- Screen inventory completed entries
- Database migrations
- Package manifests for new dependencies

## Known planning limitations

- No live Reach API or simulator yet  
- Professional profile not yet provisioned on the demo account (R1)  
- Rate limiting / abuse protection specified but not implemented  
- Physical device / TalkBack / native build blockers from Stage 18 still apply to later demo work  

## Recommended R1 scope

- Add profession + communityRequestsEnabled + emergencyRequestsEnabled to administrator worker registration (worker role only)  
- Admin API draft surfaces for professions / professional profile  
- Securely apply demo account professional profile (`communityHealthOfficer`, both enablement flags true)  
- Persist profile fields without Community Request tables yet if R1 stays admin-focused (or minimal schema only if required — follow approved R1 stage file)  
- Tests and docs; no USSD simulator; no Community Requests Centre screens  

## Approval required

Yes — human approval before Reach **R1**. Do not start R1 or Stage 19 automatically.

---

**REACH STAGE R0 COMPLETE — READY FOR R1 APPROVAL**
