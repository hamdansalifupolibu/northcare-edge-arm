# Stage 14 Checkpoint — Validation Close-Out

**Stage:** 14 — Backend, Synchronisation and Conflict Resolution  
**Validation status:** VALIDATED — READY FOR STAGE 15 APPROVAL  
**Date:** 2026-08-02  
**Git commit:** Not created (awaiting approval)  
**Stage 15:** NOT STARTED

## Meaning of “pytest 9”

Earlier reports of “API pytest: **9 passed**” meant **9 collected test cases** under pytest **9.1.1**, not nine modules. Close-out expanded the suite to **78 collected / 78 passed**.

## Section 24 fields

| Field | Value |
|---|---|
| Stage | 14 — Backend, Synchronisation and Conflict Resolution |
| Validation status | VALIDATED — READY FOR STAGE 15 APPROVAL |
| Meaning of “pytest 9” | 9 collected cases previously; runner pytest 9.1.1; now **78** cases |
| Backend tests collected | **78** (14 files under `tests/`) |
| Backend tests passed | **78** |
| Backend tests failed | **0** |
| Backend tests skipped | **0** |
| Unit-test count | **7** |
| PostgreSQL-integration count | **14** dedicated behaviours + other PG-backed API tests |
| API-test count | ~40 ASGI+PG |
| Authentication-test count | **16** (12 API authz + 3 unit + 1 gate; overlaps security) |
| Push-test count | Covered in push/pull + PG + idempotency suites |
| Pull-test count | Covered in push/pull + cursor suites |
| Idempotency-test count | **8** |
| Cursor-test count | **3** unit + pagination/scope/tamper API tests |
| Contract-test count | **7** |
| Conflict-test count | **6** API + PG conflict create/resolve |
| Security-test count | **6** |
| Migration-test count | **4** |
| PostgreSQL version | **16.2** |
| PostgreSQL runtime | Portable local (`.tools/pgsql`), `127.0.0.1:5432/northcare` — not Docker |
| Alembic head | **0001** |
| Fresh-migration result | Pass (`northcare_mig_*` created, upgraded, tables present) |
| Transaction result | Pass (record+changelog; savepoint batch semantics) |
| Idempotency result | Pass |
| Push result | Pass |
| Pull result | Pass |
| Cursor result | Pass (codec delimiter bug fixed) |
| Scope-enforcement result | Pass |
| Conflict result | Pass |
| Two-device simulation evidence | Detailed step log (see below) → `TWO_DEVICE_SIMULATION_OK` |
| Docker artifact result | STATICALLY VALIDATED |
| Docker runtime result | **NOT TESTED** (Docker CLI absent) |
| OpenAPI result | Regenerated deterministically (`sort_keys`); required paths present; prod disables usable dev auth |
| Mobile tests collected | **75** suites / **296** tests |
| Mobile tests passed | **296** |
| Mobile type-check result | Pass |
| Mobile lint result | Pass (0 errors) |
| Expo Doctor result | **20/20** |
| ADB device state | `emulator-5554 device` |
| Android Sync Centre result | **Not passed** |
| Exact Android blocker | Expo Go/auth gate: app reaches onboarding after Metro bundle (schema v8); deep link to `/(worker)/sync-centre` does not complete authenticated Sync Centre walkthrough; Expo Go menu showed SDK 51 vs project Expo 57 — see `ANDROID_SYNC_VALIDATION.md` |
| NetInfo result | Installed; used as foreground trigger only |
| Backend-reachability result | **Not separately labelled in Sync Centre UI** (generic sync error; design-system copy exists but not wired as six-state matrix) |
| Single-flight result | Pass (engine coalesce tests) |
| Background-sync status | Deferred / not enabled; UI states not enabled |
| Security logging review | Pass (redacting filter + source scan) |
| Known limitations | Docker runtime untested; Android E2E blocked; Firebase unverified; background sync disabled; Sync Centre lacks full NetInfo vs backend-reachability matrix; pull apply is sequential fail-closed (not full batch SQL transaction); some conflict-class matrix cells thin |
| Files created | See list below |
| Files modified | See list below |
| Commands run | pytest -ra; ruff; mypy; alembic; two-device script; npm typecheck/lint/test; expo-doctor; adb devices; expo start --android; OpenAPI regen |
| Git status | Dirty working tree; no commit |
| Stage 15 approval recommendation | Approve Stage 15 only after reviewing this checkpoint; do not auto-start |

## Two-device simulation (detailed)

Entity type: `client` (synthetic).  
Example run IDs:

- Device A: `1a934fb5-a910-479b-943c-1e19aea8c762`
- Device B: `9ea2baf2-7d5d-40de-be6b-8f6aff730c3a`
- Entity: `f220a6fc-dae3-44af-94ee-e3412b5664a4`
- Create op: `caacc8fa-c197-4e81-b30c-21ff4dadb6c8` → ack serverVersion=1
- Update op (B): `27e848c9-2286-48dd-89a3-8b882c82c0b4` → serverVersion=2
- Stale op (A): `37c62d5b-bcf8-4151-9949-673f27ce088d` → conflict (no LWW)
- Resolve: `chooseServer`
- Replacement op: `00001121-aa19-468c-a273-c92f165e6c9a` → ack serverVersion=3  
Cursors account/org/facility/role bound; distinct operation IDs; no real patient data.

## Docker

`DOCKER ARTIFACTS VALIDATED STATICALLY — RUNTIME NOT TESTED`

## Cursor fix (close-out)

`CursorCodec` previously concatenated raw JSON + `.` + binary HMAC before base64, so HMAC bytes containing `0x2e` broke decode. Fixed to base64url(payload) + `.` + base64url(sig). Covered by multi-sequence unit test + pagination integration tests.

## Files created / modified (close-out)

### Created
- `docs/testing/STAGE_14_TEST_COVERAGE_AUDIT.md`
- `docs/testing/BACKEND_TEST_STRATEGY.md`
- `docs/testing/SYNC_CONTRACT_TEST_STRATEGY.md`
- `docs/testing/SYNC_CONFLICT_TEST_STRATEGY.md`
- `docs/development/BACKEND_LOCAL_SETUP.md`
- `docs/development/stages/STAGE_14_BACKEND_SYNC_CONFLICTS.md`
- `docs/architecture/SYNC_PROTOCOL.md`
- `docs/security/SYNC_AUTHORISATION_POLICY.md`
- `docs/security/SYNC_DATA_PRIVACY.md`
- `services/api/tests/helpers.py`
- `services/api/tests/integration/test_postgres_behaviours.py`
- `services/api/tests/integration/test_authz_api.py`
- `services/api/tests/integration/test_idempotency_api.py`
- `services/api/tests/integration/test_push_pull_cursor.py`
- `services/api/tests/integration/test_conflicts_api.py`
- `services/api/tests/migration/test_alembic.py`
- `services/api/tests/security/test_security_controls.py`
- Screenshot evidence under `docs/development/_sync_centre_*.png`

### Modified
- `services/api/src/northcare_api/security/cursors.py`
- `services/api/tests/conftest.py`, contract/unit/integration tests
- `services/api/scripts/run_two_device_simulation.py`
- `apps/mobile/src/features/sync/__tests__/syncEngine.test.ts`
- `apps/mobile/src/features/sync/__tests__/entityApplicators.test.ts`
- `implementation/openapi.json`
- `docs/development/ANDROID_SYNC_VALIDATION.md`, `ANDROID_RUNTIME_RECOVERY.md`
- `docs/development/LOCAL_BACKEND_STACK.md`, stage notes, conflict policy
- `PROJECT_STATUS.md`, `README.md`, this checkpoint

---

STAGE 14 VALIDATED — READY FOR STAGE 15 APPROVAL
