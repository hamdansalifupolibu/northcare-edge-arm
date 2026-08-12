# Administration Architecture (Reach R1 update)

**Last updated:** 2026-08-03  
**Related:** `ADMINISTRATION_PROVISIONING_SAGA.md`, `WORKER_PROFESSIONAL_PROFILE.md`

## Scope

Administration workspace remains server-authoritative for account lifecycle. Reach R1 adds **worker professional profiles** used later for community-request routing. Profession is **not** a system role.

## Controlled system roles (unchanged)

- `worker`
- `admin`

Ordinary registration still creates **worker-only** accounts. Dual-role accounts remain development-CLI only.

## Professional profile (R1)

| Concern | Behaviour |
|---|---|
| Persistence | PostgreSQL `worker_professional_profiles` (Alembic `0004`) |
| Cardinality | At most one profile per account |
| Prerequisite | Account must include active `worker` role |
| Registry | Code/config controlled; `GET /v1/admin/professions` |
| Mutation | `PATCH /v1/admin/accounts/{accountId}/professional-profile` |
| Mobile storage | No SQLite workforce directory; short-lived API responses only |

## Registration flow (mobile)

1. Worker identity  
2. Profession and Reach settings  
3. Facility  
4. Review  
5. Register  

## Authorisation

Admin role + administration workspace + fresh remote token for mutations. Workers cannot update professions. Cross-organisation access denied. Client-supplied role/org ignored.
