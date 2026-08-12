# NorthCare Reach — Local Demo Runbook

**Last updated:** 2026-08-03  
**Environment:** local development only  
**Secrets:** never paste passwords, database credentials, tokens, or reusable status PINs into this file.

## Prerequisites

- PostgreSQL available for `services/api`  
- Python virtualenv for `services/api`  
- Node / Expo for `apps/mobile`  
- Development dual-role account already provisioned (see `NORTHCARE_REACH_DEMO_ACCOUNT.md`)  

## 1. Start PostgreSQL

Start the local Postgres instance used by the API (portable Postgres or compose, per your machine). Confirm it accepts connections on the configured `DATABASE_URL`.

## 2. Apply Alembic migrations

```powershell
cd services\api
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "src"
python -m alembic upgrade head
python -m alembic heads
```

Expected head: `0005`.

## 3. Enable Reach demo mode

In `services/api/.env` (local only, never commit secrets):

```env
NORTHCARE_ENV=development
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_REACH_DEMO_ORGANISATION_ID=org-dev-001
NORTHCARE_REACH_DEMO_FACILITY_ID=fac-dev-001
```

Default for `NORTHCARE_REACH_DEMO_ENABLED` is **false**.

## 4. Start FastAPI

```powershell
cd services\api
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "src"
uvicorn northcare_api.main:app --reload --host 127.0.0.1 --port 8000
```

## 5. Open the USSD simulator

Browser: `http://127.0.0.1:8000/reach-simulator`

Confirm simulation labelling is visible.

## 6. Optional: seed synthetic demo requests

```powershell
cd services\api
python -m northcare_api.cli.seed_reach_demo --yes --reset
```

Or create all demonstration requests live in the simulator ( equally valid).

## 7. Start the Expo mobile application

```powershell
cd apps\mobile
npx expo start
```

Point the app at the local API base URL used in development configuration.

## 8. Log in with the development account

Use the existing dual-role account email `hamdansalifupolibu@gmail.com`.  
Do not write the password here. Do not reset it for demo packaging.

## 9. Enter Worker workspace

Confirm Community Requests entry is visible for the enabled worker profile.

## 10. Open Community Requests

Refresh on open. There is no remote Reach push in the MVP.

## 11. Complete the routine scenario

Follow `docs/testing/REACH_R6_VALIDATION_MATRIX.md` routine row / judge script section 5–7.

## 12. Complete the emergency scenario

Follow judge script section 8. Confirm call-112 and no ambulance claims.

## 13. Reset the demo safely

```powershell
cd services\api
python -m northcare_api.cli.reset_reach_demo --yes
```

See `NORTHCARE_REACH_DEMO_RESET.md`.

## Admin profession check (optional)

Enter Administration → worker registration and confirm profession + community/emergency enablement fields exist. Do not leave unnecessary synthetic accounts after the demo.
