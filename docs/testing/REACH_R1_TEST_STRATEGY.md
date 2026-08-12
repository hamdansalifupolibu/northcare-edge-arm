# Reach R1 — Test Strategy

**Stage:** Reach R1  
**Last updated:** 2026-08-03  

## Approach

- **Backend:** PostgreSQL-backed FastAPI integration + Alembic migration tests.  
- **Mobile:** Jest unit/flow tests for admin registration validation and professional-profile form rules.  
- **Contracts:** R0 Reach artifact validation remains green; OpenAPI includes R1 admin surfaces only (no R2 Reach request paths).  
- Synthetic fixtures only; never assert or log passwords, verifiers, or tokens.

## Backend suites

| Area | Coverage |
|---|---|
| Profession registry | Frozen values, stable labels, duplicates absent, unknown profession rejected |
| Professional profile | Create/update, one per account, worker role required, admin-only account rejected |
| Validation | Other description rules, text limit, emergency-requires-community |
| Authorisation | Worker denied; cross-organisation denied; client-supplied org/role ignored |
| Registration | Profile on register; worker role only; rollback if profile create fails |
| Versioning | Version increment; stale version rejected |
| Demo CLI | Dev-only gate; safe summary; profile applied without password change |
| Migrations | Head `0004`; fresh migrate; upgrade from `0003` |

Primary module: `services/api/tests/integration/test_professional_profiles.py` (+ Alembic / Postgres behaviour tests).

## Mobile suites

| Area | Coverage |
|---|---|
| Registration flow | Profession step in identity → profession → facility → review → success |
| Form policy | Known profession required; other description; emergency/community flag rule |
| Account details | Profile shown; null → not configured |
| Authorisation | Admin workspace required; offline mutation blocked |

Primary module: `apps/mobile/src/features/administration/__tests__/registrationFlow.test.ts` (and related admin tests).

## Quality gates (R1 recorded)

| Check | Result |
|---|---|
| Mobile tests | 377 passed / 86 suites |
| Backend tests | 110 passed |
| Expo Doctor | 20/20 |
| Mobile typecheck | Pass |
| Mobile lint | Pre-existing `ClientRegisterScreen` react-hooks error (not R1) |
| Backend ruff / mypy | Pass |
| Packages | None installed |

## Explicitly not tested in R1

Community request routing, public Reach endpoints, USSD simulator, Worker Community Requests Centre, Stage 19 E2E.
