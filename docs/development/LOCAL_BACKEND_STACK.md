# Local Backend Stack

**Stage:** 14  
**Service:** NorthCare AI Sync API (`services/api`)  
**Data policy:** local development uses synthetic fixtures only.

## Docker Compose (team path)

**DOCKER ARTIFACTS VALIDATED STATICALLY — RUNTIME NOT TESTED** on the Stage 14 validation host (Docker CLI absent). Compose + `services/api/Dockerfile` were inspected for services, healthcheck, migrate-on-start CMD, and non-production credential placeholders only.

Docker Compose remains the documented shared-development path:

```bash
docker compose up --build
docker compose exec api python scripts/seed_dev.py
```

- API: `http://localhost:8000`
- Health: `/health/live`, `/health/ready`
- Development database: `northcare`

## Windows portable PostgreSQL (validated without Docker Desktop)

Docker Desktop was absent during Stage 14 local validation. A portable PostgreSQL 16.2 instance listening on `127.0.0.1:5432` was used successfully instead. The working local URL was:

```text
postgresql+asyncpg://northcare@127.0.0.1:5432/northcare
```

This assumes a local `northcare` database role that does not require a password. Do not reuse this authentication configuration outside a controlled local development environment.

### Bootstrap

From `services/api`, use a virtual environment outside OneDrive if a project-local `.venv` is locked:

```powershell
py -3.14 -m venv "$env:LOCALAPPDATA\Temp\northcare-api-venv"
& "$env:LOCALAPPDATA\Temp\northcare-api-venv\Scripts\python.exe" -m pip install -e ".[dev]"
```

Copy `services/api/.env.example` to `services/api/.env` only if `.env` is absent, then set `DATABASE_URL` to the local URL above. `.env` is gitignored and must never be committed.

With PostgreSQL already listening on port 5432:

```powershell
& "$env:LOCALAPPDATA\Temp\northcare-api-venv\Scripts\python.exe" "..\..\.tools\ensure_db.py"
& "$env:LOCALAPPDATA\Temp\northcare-api-venv\Scripts\python.exe" -m alembic upgrade head
& "$env:LOCALAPPDATA\Temp\northcare-api-venv\Scripts\python.exe" scripts\seed_dev.py
```

`ensure_db.py` connects to the local `postgres` database and creates `northcare` if it does not exist. The Stage 14 validation run found the database already present and confirmed PostgreSQL 16.2.

### Run and validate

```powershell
$env:NORTHCARE_ENV = "development"
$env:DATABASE_URL = "postgresql+asyncpg://northcare@127.0.0.1:5432/northcare"
& "$env:LOCALAPPDATA\Temp\northcare-api-venv\Scripts\python.exe" -m uvicorn northcare_api.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health/live
Invoke-RestMethod http://127.0.0.1:8000/health/ready
& "$env:LOCALAPPDATA\Temp\northcare-api-venv\Scripts\python.exe" scripts\run_two_device_simulation.py
```

Validated results: both health endpoints returned their expected `live` / `ready` status, and `TWO_DEVICE_SIMULATION_OK` confirmed create, idempotent replay, pull, stale-update conflict, controlled resolution, and soft-delete tombstone handling.

## Secrets

Use `services/api/.env.example` as the shape for a local `.env`; do not commit `.env`, Firebase service accounts, bearer tokens, or real patient data. Production identity remains fail-closed until explicitly provisioned.
