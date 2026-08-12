# REACH STAGE R1 — Worker Profession and Administrator Integration

**Status:** Implemented — complete, awaiting R2 approval  
**Prerequisites:** Reach R0 complete and approved; Stages 1–18 complete; Stage 19 paused  
**Next stage:** R2 — Community Request Backend and Routing (**do not start automatically**)  
**Date:** 2026-08-03  

## Purpose

Extend administrator worker registration so every newly registered health worker has a controlled professional profile (profession + community/emergency enablement flags) for later Reach routing. Persist profiles on the API; integrate admin UI and demo-account provisioning.

## Included in R1

- Frozen eight-value profession registry (separate from system roles `worker` / `admin`)
- PostgreSQL table `worker_professional_profiles` (Alembic **0004**, revises **0003**)
- Admin APIs:
  - `GET /v1/admin/professions`
  - `PATCH /v1/admin/accounts/{accountId}/professional-profile`
  - `RegisterWorkerRequest` includes `profession`, `communityRequestsEnabled`, `emergencyRequestsEnabled`
- Mobile admin registration: identity → profession → facility → review → success
- Account details show professional profile; add/edit screen for legacy/null profiles
- Development CLI: `python -m northcare_api.cli.set_development_professional_profile` (dev only)
- Demo dual-role account profile applied (`communityHealthOfficer`, both flags true)
- OpenAPI regenerated (**24** paths); tests and docs

## Excluded from R1

- CommunityRequest tables / routing / public Reach endpoints
- USSD simulator / Community Requests Centre / emergency worker screens
- Mobile SQLite migration (profiles are server-authoritative admin data)
- New runtime packages
- Starting R2 or Stage 19

## Key decisions

| Topic | Decision |
|---|---|
| Profession vs role | Profession is not a system role; ordinary registration remains worker-only |
| Storage | API PostgreSQL authoritative; no mobile workforce directory / SQLite migration |
| Legacy accounts | `professionalProfile` null → UI “not configured” |
| Flags | Emergency enablement requires community enablement |
| Demo account | Existing dual-role identity preserved; password not changed |

## Key paths

| Area | Path |
|---|---|
| Stage checkpoint | `docs/development/REACH_R1_CHECKPOINT.md` |
| Demo profile setup | `docs/development/REACH_R1_DEMO_PROFILE_SETUP.md` |
| Architecture | `docs/architecture/WORKER_PROFESSIONAL_PROFILE.md` |
| Migration | `services/api/alembic/versions/0004_worker_professional_profiles.py` |
| Demo CLI | `services/api/src/northcare_api/cli/set_development_professional_profile.py` |
| Mobile admin | `apps/mobile/src/features/administration/` |
| Profession step route | `apps/mobile/app/(admin)/accounts/register/profession.tsx` |

## Exit

Checkpoint approved → ready for **R2 approval**. Do not auto-start R2 or Stage 19.
