# Stage 14 — Test Coverage Audit

**Date:** 2026-08-02  
**Command:** `python -m pytest -ra` from `services/api/`  
**Runner:** pytest **9.1.1**  
**Result:** **78 collected / 78 passed / 0 failed / 0 skipped / 0 xfailed** (~14–20s)

## Meaning of earlier “pytest 9”

Prior checkpoint text “API pytest: **9 passed**” meant **9 collected test cases**, not nine modules and not “pytest major version alone”. After close-out expansion, the suite is **78 cases**. The installed runner is still pytest 9.x (`9.1.1`).

## Classification

| Category | Files | Collected cases | Real PostgreSQL? | Result | Missing / notes |
|---|---|---:|---|---|---|
| Unit | `tests/unit/test_auth_verifiers.py`, `test_cursors.py`, `test_hashing.py` | 7 | No | Pass | — |
| PostgreSQL integration | `tests/integration/test_postgres_behaviours.py`, shared by other integration modules | 14 dedicated (+ others) | **Yes** (`127.0.0.1:5432/northcare`) | Pass | True multi-connection race lightly sequential |
| API | integration modules via ASGI `AsyncClient` | ~40 | Yes | Pass | — |
| Authentication / authorisation | `tests/integration/test_authz_api.py`, unit verifiers, security gate | 12 + 3 + 1 | Mixed | Pass | Cross-org pull filter still thin; Firebase live not tested (by design) |
| Sync push | `test_push_pull_cursor.py`, `test_sync_flow.py`, PG behaviours | ~10 | Yes | Pass | Some push edge cases (oversized payload, immutable clinical) not exhaustively named |
| Sync pull | same | ~8 | Yes | Pass | — |
| Idempotency | `tests/integration/test_idempotency_api.py` | 8 | Yes | Pass | — |
| Cursor | unit + pull/cursor integration | 3 + several | Mixed | Pass | Codec delimiter bug fixed in close-out |
| Conflict | `tests/integration/test_conflicts_api.py` + PG 11/12 | 6+ | Yes | Pass | Not every conflict-class matrix cell named |
| Security | `tests/security/*` | 6 | No (static + settings) | Pass | Request-size middleware not separately asserted |
| Contract | `tests/contract/test_protocol_contract.py` | 7 | No | Pass | Drift check on protocolVersion |
| Migration | `tests/migration/test_alembic.py` | 4 | Yes (incl. fresh DB) | Pass | Downgrade status recorded (may return non-zero) |
| Two-device simulation | `scripts/run_two_device_simulation.py` | **not pytest** | Yes (live HTTP) | Pass (script) | Detailed step log required; see checkpoint |

## PostgreSQL environment (proven)

| Item | Value |
|---|---|
| Version | PostgreSQL **16.2** (portable binaries under `.tools/pgsql`) |
| Host type | Portable local installation (not Docker) |
| DB | `northcare` on `127.0.0.1:5432` |
| Isolation | Shared DB; tests use UUID entity/operation IDs; fresh DB used for migration test (`northcare_mig_*`) |
| Cleanup | No full truncate between tests; unique IDs avoid collisions |
| Migrations before tests | Applied (`alembic_version=0001`); migration suite re-runs `upgrade head` |
| Real transactions | Yes (SQLAlchemy async + savepoints per push op) |
| Concurrency | Stale concurrent writers proven sequentially; not a stress harness |

## Mobile sync tests (Jest)

| File | Cases |
|---|---:|
| `apps/mobile/src/features/sync/__tests__/*` | **12** passed |
| Full mobile suite | **75** suites / **296** tests |

Cursor advance is **not** performed in `finally` (engine/provider finally only clears single-flight / UI). Pull apply is sequential fail-closed for cursor (not full SQLite batch rollback).
