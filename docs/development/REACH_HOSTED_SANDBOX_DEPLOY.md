# Hosted sandbox deploy — NorthCare API (hackathon)

**Honesty:** This host is a **hosted sandbox backend** for Africa's Talking **sandbox** USSD.  
It is **not** production telecom, not a live Ghana shortcode, and not SMS.

**Config stance:** Keep `NORTHCARE_ENV=development` on this host so T1 may enable AT sandbox (`NORTHCARE_REACH_AT_USSD_*`). Do **not** set `NORTHCARE_REACH_AT_USSD_MODE=live`. Do **not** claim `staging`/`production` with AT enabled (app refuses).

## Inventory (what you are deploying)

| Piece | Detail |
|---|---|
| App | `services/api` FastAPI (`northcare_api.main:app`) |
| Container | `services/api/Dockerfile` — `alembic upgrade head` then uvicorn |
| Local compose | Root `docker-compose.yml` (API + Postgres 16) — local only |
| Postgres | Required (Reach + AT webhook create/status use DB) |
| AT webhook | `POST /v1/reach/ussd/africas-talking/{callbackSecret}` |
| Service code (demo) | `*384*91620#` (must match AT dashboard allowlist / env) |

Host preference: **Render** (dashboard click path — no CLI), **Fly.io** (`fly.toml`), or **Railway** (`railway.toml`). Free Render sleeps when idle — wake `/health/live` 2–3 minutes before demo day, or use a paid always-on plan / Fly/Railway if cold starts are unacceptable.

## Env checklist (platform secrets — never commit)

Set these on the host secret store:

| Variable | Hosted-sandbox value |
|---|---|
| `NORTHCARE_ENV` | `development` |
| `NORTHCARE_REACH_DEMO_ENABLED` | `true` |
| `NORTHCARE_REACH_AT_USSD_ENABLED` | `true` |
| `NORTHCARE_REACH_AT_USSD_MODE` | `sandbox` |
| `NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET` | Long random path secret (reuse local `.env` value **or** generate new and update AT) |
| `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` | `*384*91620#` (exact AT sandbox service code) |
| `DATABASE_URL` | Host Postgres URL (`postgres://` / `postgresql://` OK — API normalises to `+asyncpg`) |
| `DEV_AUTH_SECRET` | New strong secret (not the default) |
| `CURSOR_SIGNING_SECRET` | New strong secret (not the default) |
| `SYNC_PROTOCOL_VERSION` | `1` |
| `NORTHCARE_REACH_DEMO_ORGANISATION_ID` | `org-dev-001` (or your seeded org) |
| `NORTHCARE_REACH_DEMO_FACILITY_ID` | `fac-dev-001` (or your seeded facility) |

Optional after first boot: seed demo accounts/facilities via one-off `railway run` / `flyctl ssh console` using existing demo CLIs (same as local).

Generate secrets (PowerShell):

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Callback URL for Africa's Talking

```text
https://<PUBLIC_HOST>/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>
```

Paste the **full** URL into the AT sandbox USSD **Callback URL** field.  
Allowlist service code must stay `*384*91620#` (or whatever AT shows — keep env in sync).

## User actions when CLI auth is missing (current blocker)

**Status:** Deploy files are ready. **No HTTPS host was created from this agent session.**

| Platform | Auth on this machine | How to unblock |
|---|---|---|
| Fly.io | `flyctl` installed; **not logged in** | Open an interactive PowerShell → `flyctl auth login` → Option A below |
| Railway | CLI installed; **not logged in** | Interactive `railway login` (or `--browserless` + activate URL) → Option B |
| Render | **No CLI needed** | Use Option C dashboard / Blueprint — fastest path without terminal auth |

After you log in (Fly/Railway) or create the Render service, reply that auth is done (or paste the public host) and the agent can finish secrets, deploy, smoke POST, and give the final AT callback URL.

Fly/Railway CLIs need an interactive login. **Render does not require a CLI** — use Option C (dashboard) if you already have a Render account.

### Option C — Render (dashboard click path; Blueprint `render.yaml`)

> **Honesty:** Hosted **sandbox** API only (`NORTHCARE_ENV=development`). Not live telecom.

#### Git root warning

| If Git root is… | Root Directory | Blueprint Path |
|---|---|---|
| `NorthCare AI Project` | `services/api` | `services/api/render.yaml` |
| Parent `Hon. Salifu Dandaawa` | `NorthCare AI Project/services/api` | `NorthCare AI Project/services/api/render.yaml` |

#### Manual steps

1. **New → PostgreSQL** — name e.g. `northcare-api-db`, Free plan OK for sandbox. Copy **Internal Database URL** when ready.  
2. **New → Web Service** → connect repo → **Docker**.  
   - Root Directory: `services/api` (or parent-repo path above)  
   - Dockerfile Path: `./Dockerfile`  
   - Build context: `.`  
3. **Environment** — set the env checklist table above. Paste Render’s `postgresql://…` URL into `DATABASE_URL` (API adds `+asyncpg`).  
4. Deploy → open `https://<service>.onrender.com/health/live` and optionally `/docs`.  
5. AT callback: `https://<service>.onrender.com/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>`  
6. **Free tier:** wake the service 2–3 minutes before the demo (first request after sleep is slow).

Optional: **New → Blueprint** → `services/api/render.yaml` (adjust Blueprint Path if Git root is the parent). Then set `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` in the dashboard (`sync: false` in the Blueprint).

### Option A — Fly.io (preferred files: `fly.toml`)

In an **interactive** PowerShell (Cursor agent shells cannot complete `flyctl auth login`):

```powershell
$env:Path = "$env:USERPROFILE\.fly\bin;" + $env:Path
flyctl auth login
cd "C:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project\services\api"

# Create app (once) — adjust name if taken
flyctl apps create northcare-api-sandbox

# Managed Postgres (once) — pick a nearby region when prompted
flyctl postgres create --name northcare-api-db --vm-size shared-cpu-1x --volume-size 1
flyctl postgres attach northcare-api-db -a northcare-api-sandbox

# Secrets (paste real values; do not commit)
flyctl secrets set `
  NORTHCARE_ENV=development `
  NORTHCARE_REACH_DEMO_ENABLED=true `
  NORTHCARE_REACH_AT_USSD_ENABLED=true `
  NORTHCARE_REACH_AT_USSD_MODE=sandbox `
  NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET="<CALLBACK_SECRET>" `
  NORTHCARE_REACH_AT_USSD_SERVICE_CODES="*384*91620#" `
  DEV_AUTH_SECRET="<NEW_STRONG_SECRET>" `
  CURSOR_SIGNING_SECRET="<NEW_STRONG_SECRET>" `
  SYNC_PROTOCOL_VERSION=1 `
  NORTHCARE_REACH_DEMO_ORGANISATION_ID=org-dev-001 `
  NORTHCARE_REACH_DEMO_FACILITY_ID=fac-dev-001 `
  -a northcare-api-sandbox

flyctl deploy -a northcare-api-sandbox
flyctl status -a northcare-api-sandbox
flyctl apps open -a northcare-api-sandbox
```

Hostname is typically `https://northcare-api-sandbox.fly.dev` (confirm with `flyctl status`).

### Option B — Railway (`railway.toml`)

```powershell
railway login
# or: railway login --browserless   then open the printed activate URL / enter the code
cd "C:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project\services\api"
railway init
railway add --database postgres
railway variables set `
  NORTHCARE_ENV=development `
  NORTHCARE_REACH_DEMO_ENABLED=true `
  NORTHCARE_REACH_AT_USSD_ENABLED=true `
  NORTHCARE_REACH_AT_USSD_MODE=sandbox `
  NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET="<CALLBACK_SECRET>" `
  NORTHCARE_REACH_AT_USSD_SERVICE_CODES="*384*91620#" `
  DEV_AUTH_SECRET="<NEW_STRONG_SECRET>" `
  CURSOR_SIGNING_SECRET="<NEW_STRONG_SECRET>" `
  SYNC_PROTOCOL_VERSION=1 `
  NORTHCARE_REACH_DEMO_ORGANISATION_ID=org-dev-001 `
  NORTHCARE_REACH_DEMO_FACILITY_ID=fac-dev-001
# Ensure DATABASE_URL from the Postgres plugin is linked to the API service
railway up
railway domain
```

## Smoke POST (expect `CON`)

```powershell
$secret = "<CALLBACK_SECRET>"
$host = "https://<PUBLIC_HOST>"   # e.g. https://northcare-api.onrender.com or https://northcare-api-sandbox.fly.dev
$uri = "$host/v1/reach/ussd/africas-talking/$secret"
Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/x-www-form-urlencoded" -Body @{
  sessionId = "hosted-smoke-1"
  phoneNumber = "+233200000001"
  networkCode = "62002"
  serviceCode = "*384*91620#"
  text = ""
}
```

Expect a plain-text body starting with `CON NORTHCARE REACH`.

## After deploy

1. Update AT sandbox dashboard **Callback URL** to the fixed HTTPS URL above.  
2. Stop relying on `cloudflared` / ngrok for judging (keep as laptop backup only).  
3. See `REACH_AT_USSD_SANDBOX_RUNBOOK.md` → Demo day.

## Fail-closed reminders

- Do not enable live AT mode.  
- Do not commit `.env` / secrets.  
- Do not start Stage 19 from this deploy track.
