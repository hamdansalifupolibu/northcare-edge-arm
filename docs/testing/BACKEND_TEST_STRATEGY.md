# Backend Test Strategy — Stage 14

## Goals

Prove sync protocol safety against real PostgreSQL: authz fail-closed, idempotent push, cursor pull, conflicts, migrations, and contracts — without live Firebase or Docker runtime dependency.

## Layers

1. **Unit** — verifiers, cursor codec, hashing (no DB).
2. **ASGI + PostgreSQL integration** — httpx `ASGITransport` against `northcare_api.main:app` with portable Postgres.
3. **Migration** — Alembic head / applied revision / fresh DB / downgrade status.
4. **Contract** — `implementation/sync-*.json` + OpenAPI artifact drift checks.
5. **Security** — development-auth gating, redacting filter, source scan for payload/token logging.
6. **Manual/scripted** — `scripts/run_two_device_simulation.py` against running uvicorn (not counted as pytest).

## Commands

```powershell
cd services/api
$env:PYTHONPATH="src"
$env:NORTHCARE_ENV="test"
$env:DATABASE_URL="postgresql+asyncpg://northcare@127.0.0.1:5432/northcare"
.\.venv\Scripts\python.exe -m pytest -ra
.\.venv\Scripts\ruff.exe check src tests
.\.venv\Scripts\mypy.exe src/northcare_api
```

## Rules

- Do not count SQLite or mocked repositories as PostgreSQL coverage.
- Do not treat the two-device script as a pytest case.
- Dispose the async engine between function-scoped event loops (see `tests/conftest.py`).
- Synthetic fixtures only — never real patient data.
