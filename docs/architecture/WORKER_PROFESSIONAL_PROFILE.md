# Worker Professional Profile

**Status:** Implemented in Reach Stage R1 (frozen enum from R0)  
**Last updated:** 2026-08-03  
**Machine-readable:** `implementation/worker-profession-registry.json`  
**Stage:** `docs/development/stages/REACH_R1_WORKER_PROFESSION_ADMIN.md`

## Profession â‰  system role

| Concept | Example | Purpose |
|---|---|---|
| System role | `worker`, `admin` | Workspace and authorisation |
| Profession | `communityHealthOfficer` | Clinical/community skill for Reach routing |

Ordinary administrator registration continues to create **worker** accounts only. It must **not** expose admin role selection, dual-role selection, or an emergency-dispatcher role. Emergency handling is a **worker capability** (`emergencyRequestsEnabled`), not a new account role.

## Profession enum (frozen)

- `communityHealthOfficer`  
- `communityHealthNurse`  
- `registeredGeneralNurse`  
- `midwife`  
- `nutritionOfficer`  
- `physicianAssistant`  
- `emergencyMedicalTechnician`  
- `otherApprovedHealthProfessional`  

Primary profession value is controlled enum only. Optional free-text description may accompany `otherApprovedHealthProfessional`.

## Persistence (R1)

| Item | Value |
|---|---|
| Table | `worker_professional_profiles` |
| Alembic | `0004` (revises `0003`) |
| Authority | API PostgreSQL â€” not mobile SQLite |
| Cardinality | At most one profile per account; worker role required |
| Legacy | Missing row / null in API â†’ UI â€œnot configuredâ€ |

## Admin registration fields (R1 â€” implemented)

1. Profession  
2. Community requests enabled (`communityRequestsEnabled`)  
3. Emergency requests enabled (`emergencyRequestsEnabled`)  

Validation: emergency enablement requires community enablement.

**Not in MVP:** professional licence verification, speciality management, shift scheduling, catchment polygons, workload targets, multiple facilities, worker ranking, detailed language profiles, duty rosters.

## Live admin API (R1)

- `GET /v1/admin/professions`  
- `PATCH /v1/admin/accounts/{accountId}/professional-profile`  
- `RegisterWorkerRequest` includes profession + both enablement flags  

OpenAPI: `implementation/openapi.json` (32 paths after R2 regeneration). Profiles remain the eligibility input for R2 deterministic routing.

## Development dual-role account

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Account ID | `dev-dual-8d2ce4bbb8e656c8afea` |
| Roles | `worker`, `admin` |
| Facility | `fac-dev-001` |
| Organisation | `org-dev-001` |
| Profession | `communityHealthOfficer` |
| Community requests enabled | `true` |
| Emergency requests enabled | `true` |

Password / verifier must never be hardcoded, documented, printed, or placed in fixtures. Profile applied via:

`python -m northcare_api.cli.set_development_professional_profile` (development only).

See `docs/development/NORTHCARE_REACH_DEMO_ACCOUNT.md` and `docs/development/REACH_R1_DEMO_PROFILE_SETUP.md`.

