# NorthCare Reach — Local Configuration (R2–R6)

## Enable Reach demonstration APIs and USSD simulator

In `services/api` (development only):

```env
NORTHCARE_ENV=development
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_REACH_DEMO_ORGANISATION_ID=org-dev-001
NORTHCARE_REACH_DEMO_FACILITY_ID=fac-dev-001
```

Optional abuse-control tuning:

```env
NORTHCARE_REACH_STATUS_LOOKUP_MAX_FAILURES=5
NORTHCARE_REACH_STATUS_LOOKUP_LOCKOUT_SECONDS=900
```

Default for `NORTHCARE_REACH_DEMO_ENABLED` is **false**. Do not enable it automatically.

## USSD simulator (R3)

With the gate enabled, open:

`http://127.0.0.1:8000/reach-simulator`

Static assets: `services/api/static/reach-simulator/`. See `docs/development/NORTHCARE_REACH_SIMULATOR_RUNBOOK.md`.

## Worker Community Requests (R4)

With the gate enabled and the mobile app pointed at the same API base URL:

1. Sign in as the development dual-role account  
2. Enter **Worker** workspace  
3. Open **Community Requests**

See `docs/development/NORTHCARE_REACH_WORKER_RUNBOOK.md`.

Community Requests are online-required. They do not use a local SQLite request repository or offline mutation queue.

## Demo reset and seed (R6)

Development-only CLIs (no public HTTP reset):

```powershell
python -m northcare_api.cli.reset_reach_demo --yes
python -m northcare_api.cli.seed_reach_demo --yes --reset
```

See `NORTHCARE_REACH_DEMO_RESET.md` and `NORTHCARE_REACH_DEMO_RUNBOOK.md`.

## Production protection

If `NORTHCARE_REACH_DEMO_ENABLED=true` while `NORTHCARE_ENV` is `staging` or `production`, settings validation raises and the process must not start with that configuration.

Public Reach routes, worker Reach routes, and the simulator fail closed when the effective gate is off.

This is **not** a claim that the public Reach surface is production-hardened.

## Gated endpoints

- `POST /v1/reach/requests`  
- `POST /v1/reach/requests/status`  
- `GET/POST /v1/worker/community-requests...`  
- `GET /reach-simulator` and allow-listed assets  

Admin profession endpoints from R1 remain separate and are not controlled by this flag.
