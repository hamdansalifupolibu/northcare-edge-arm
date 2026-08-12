# services/api — NorthCare AI Sync, Administration, and Reach API

**Stage:** Reach R2–R6 + T1 AT USSD sandbox webhook (Stages 14–18 sync/admin preserved)  
**Stack:** FastAPI · PostgreSQL · SQLAlchemy async · Alembic · Pydantic v2  
**Protocol:** `SYNC_PROTOCOL_VERSION=1`  
**Alembic head:** `0006`

## Local run (host Postgres)

```bash
cd services/api
py -3.12 -m venv .venv
.\.venv\Scripts\pip install fastapi "uvicorn[standard]" pydantic pydantic-settings "sqlalchemy[asyncio]" asyncpg alembic PyJWT httpx pytest pytest-asyncio ruff mypy argon2-cffi
.\.venv\Scripts\pip install -e . --no-deps
copy .env.example .env
$env:PYTHONPATH="src"
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe scripts\seed_dev.py
.\.venv\Scripts\python.exe -m uvicorn northcare_api.main:app --host 127.0.0.1 --port 8000
```

## Docker Compose (canonical)

From repo root (requires Docker Desktop):

```bash
docker compose up --build
docker compose exec api python scripts/seed_dev.py
```

## Tests / simulation

```bash
$env:PYTHONPATH="src"
.\.venv\Scripts\python.exe -m pytest tests -q
.\.venv\Scripts\python.exe scripts\run_two_device_simulation.py http://127.0.0.1:8000
```

## Auth

- Development/test: `POST /v1/development/auth/token`
- Session authorisation: `GET /v1/auth/session`
- Staging/production: Firebase verifier when configured; otherwise fail closed (`UnavailableAccessTokenVerifier`)

## Administration (Stage 16 + Reach R1)

Protected routes under `/v1/admin/...` require an active admin-bearing account. Ordinary registration creates **worker** role only. Dual-role development accounts are provisioned only via:

```bash
python -m northcare_api.cli.provision_development_account --email … --roles worker admin --update-existing
```

Passwords use getpass/stdin only — never CLI args, docs, or fixtures.

### Professional profiles (Reach R1)

- `GET /v1/admin/professions` — frozen profession registry  
- `PATCH /v1/admin/accounts/{account_id}/professional-profile` — create/update profile  
- Worker registration includes `profession`, `communityRequestsEnabled`, `emergencyRequestsEnabled`  
- Table `worker_professional_profiles` (Alembic **0004**)  
- Development profile CLI (dev only; does not change passwords):

```bash
python -m northcare_api.cli.set_development_professional_profile \
  --email … --profession communityHealthOfficer \
  --community-requests-enabled --emergency-requests-enabled
```

## NorthCare Reach (R2–R6 + T1 sandbox)

Enable only in development:

```env
NORTHCARE_ENV=development
NORTHCARE_REACH_DEMO_ENABLED=true
```

| Endpoint | Purpose |
|---|---|
| `GET /reach-simulator` | Browser USSD simulator UI (R3; static HTML/CSS/JS) |
| `POST /v1/reach/ussd/africas-talking/{callbackSecret}` | Africa's Talking sandbox USSD webhook (T1; plain-text `CON`/`END`) |
| `POST /v1/reach/requests` | Create synthetic community request |
| `POST /v1/reach/requests/status` | Privacy-safe status lookup |
| `GET /v1/worker/community-requests` | Worker list (`filter=awaiting\|assignedToMe\|emergency\|handled`) |
| `GET /v1/worker/community-requests/{id}` | Worker detail |
| `POST .../acknowledge` | Acknowledge / atomic claim |
| `POST .../contact-attempt` | Record contact attempt |
| `POST .../escalate` | Escalate for further human support |
| `POST .../handle` | Mark workflow handled (not clinical completion) |

AT sandbox also needs `NORTHCARE_REACH_AT_USSD_*` flags (see `.env.example`). AT only POSTs to the Callback URL you configure; Cloudflare/`cloudflared` is an optional temporary public bridge to localhost. USSD menus need the API + public callback; Expo is only needed for the worker app story.

### Hosted USSD (Render)

Hackathon sandbox API (not live telecom): **`https://northcare-api.onrender.com`**.  
Callback shape: `/v1/reach/ussd/africas-talking/{callbackSecret}`. Wake `/health/live` before demos on Free tier.

Judge-facing explanation: [root README — NorthCare Reach USSD](../../README.md#northcare-reach--ussd-system-as-implemented).  
Ops detail: [`docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`](../../docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md) and [`docs/development/REACH_HOSTED_SANDBOX_DEPLOY.md`](../../docs/development/REACH_HOSTED_SANDBOX_DEPLOY.md) (`render.yaml` / `fly.toml` / `railway.toml`).

Development-only demo CLIs (no public HTTP reset):

```bash
python -m northcare_api.cli.reset_reach_demo --yes
python -m northcare_api.cli.seed_reach_demo --yes --reset
```

Table `community_requests` (Alembic **0006**, includes `ussdAfricasTalkingSandbox`). Simulator files: `static/reach-simulator/`. See `docs/development/NORTHCARE_REACH_LOCAL_CONFIGURATION.md`, `docs/development/NORTHCARE_REACH_DEMO_RUNBOOK.md`, `docs/development/NORTHCARE_REACH_DEMO_RESET.md`, and `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`.

## Rules

- Local-first mobile writes must not require immediate API success
- Administration mutations require connectivity and are not clinical sync-queue operations
- No real patient data — synthetic fixtures only
- Never log tokens, PINs, passwords, verifiers, contact numbers, or clinical payloads
