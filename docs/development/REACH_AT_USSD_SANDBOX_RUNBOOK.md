# NorthCare Reach — Africa's Talking USSD sandbox runbook (T1)

**Audience:** Developers wiring the AT sandbox callback to a NorthCare API.  
**Honesty:** Sandbox / tunnel or hosted demo endpoint only. This does **not** provision a live Ghana shortcode, paid dedicated USSD, or SMS.

## Cloudflare vs Africa's Talking

| Piece | Who owns it | Role |
|---|---|---|
| Callback URL in AT dashboard | Africa's Talking | AT **only** stores this URL and **POSTs** USSD session form data to it |
| Cloudflare quick tunnel (`trycloudflare.com` / `cloudflared`) | **NorthCare / demo host** | Temporary public HTTPS bridge from the internet to a **localhost** API — **not** part of Africa's Talking |
| NorthCare webhook | NorthCare API | Answers with plain-text `CON` / `END` menus |

When `cloudflared` (or ngrok) stops, the public host dies. AT still has a callback URL, but it no longer reaches your API — the operator typically sees Africa's Talking’s **stock landing / default page**, not NorthCare menus. That is a common demo risk.

## What you must run (mobile vs USSD)

| Goal | Required | Not required |
|---|---|---|
| AT sandbox USSD menus (simulator dial `*384*XXXX#`) | API + Postgres + public HTTPS callback configured in AT | Expo / Android app |
| Worker Community Requests Centre | Expo mobile + API (same backend that received the create) | AT dial for a pure browser-sim path |
| Full story (community → worker) | API (+ public callback if using AT) **and** Expo worker app | Live shortcode |

USSD itself does **not** require Expo. It requires the **API** and a **reachable** callback URL.

## Callback URL format

```text
https://<PUBLIC_HOST>/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>
```

Paste that full URL into the Africa's Talking sandbox USSD **callback URL** field.

## Environment variables

Set in `services/api/.env` (never commit real secrets):

| Variable | Value |
|---|---|
| `NORTHCARE_ENV` | `development` |
| `NORTHCARE_REACH_DEMO_ENABLED` | `true` |
| `NORTHCARE_REACH_AT_USSD_ENABLED` | `true` |
| `NORTHCARE_REACH_AT_USSD_MODE` | `sandbox` (only value allowed in T1) |
| `NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET` | Long random string (path secret) |
| `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` | Exact sandbox service code from AT (e.g. `*384*XXXX#`) |
| `API_PORT` | `8000` (or your local port) |
| `DATABASE_URL` | Local (or hosted) Postgres async URL |

Generate a secret (PowerShell):

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Start the API

From `services/api` with the project venv active and Postgres running:

```powershell
cd "services\api"
.\.venv\Scripts\Activate.ps1
$env:NORTHCARE_ENV="development"
uvicorn northcare_api.main:app --host 0.0.0.0 --port 8000
```

Confirm:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/ | Select-Object -ExpandProperty Content
```

## Public HTTPS — preferred vs backup

### Preferred for hackathon judging — stable hosted API

Deploy the NorthCare API (and its Postgres) to a **stable HTTPS host**.

| Host | Config / guide |
|---|---|
| **Render (dashboard click path)** | Section below + Blueprint `services/api/render.yaml` |
| Fly.io | `services/api/fly.toml` + [`REACH_HOSTED_SANDBOX_DEPLOY.md`](./REACH_HOSTED_SANDBOX_DEPLOY.md) |
| Railway | `services/api/railway.toml` + same hosted deploy doc |

1. Set the same `NORTHCARE_REACH_AT_USSD_*` flags on the host (secrets via the platform’s secret store — never in git). Use `NORTHCARE_ENV=development` on this demo host only.  
2. Put the **fixed** HTTPS callback URL into the AT sandbox dashboard once.  
3. Do **not** depend on cloudflared/ngrok running on a laptop during judging.  
4. Optionally keep a laptop tunnel documented as **backup only**.

**Recommendation for demo day:** stay on AT **sandbox + web simulator** + NorthCare menus. Do **not** rush paid dedicated USSD / live shortcode just to impress — reliability of the callback matters more than a production-looking shortcode claim.

### Deploy on Render — click path (no CLI required)

> **Honesty banner:** This hosts a **development-gated** NorthCare API so Africa's Talking **sandbox** can reach a stable HTTPS callback. It is **not** production telecom, not a live Ghana shortcode, and not a claim that USSD is live on mobile networks. Keep `NORTHCARE_ENV=development` and `NORTHCARE_REACH_AT_USSD_MODE=sandbox`. Do **not** enable live mode (the app rejects `MODE=live`).

Optional Blueprint: `services/api/render.yaml` (Postgres + Docker web). Manual click path below works without the Render CLI.

#### 0) Confirm your Git root (important)

Render builds from a **GitHub/GitLab repo**. Check which folder is that repo’s root:

| If Git root is… | Root Directory on Render | Dockerfile path | Blueprint Path (optional) |
|---|---|---|---|
| `NorthCare AI Project` | `services/api` | `./Dockerfile` | `services/api/render.yaml` |
| Parent `Hon. Salifu Dandaawa` (contains other apps **and** `NorthCare AI Project/`) | `NorthCare AI Project/services/api` | `./Dockerfile` | `NorthCare AI Project/services/api/render.yaml` |

Spaces in `NorthCare AI Project` are part of the path — paste carefully. Prefer a repo whose root is the NorthCare project folder.

#### 1) New → PostgreSQL

1. Open [https://dashboard.render.com](https://dashboard.render.com) → **New** → **PostgreSQL**.  
2. Name e.g. `northcare-api-db`. Choose a nearby region. Plan: **Free** is OK for sandbox (wake the web service before demos).  
3. Create → wait until **Available**.  
4. Open the DB → **Connections** → copy **Internal Database URL** (when the web service is also on Render).  
5. URL looks like `postgresql://user:pass@host/dbname`. The API rewrites it to `postgresql+asyncpg://…` automatically — paste Render’s URL as-is.

#### 2) New → Web Service → Docker

1. **New** → **Web Service** → connect the Git repo that contains NorthCare.  
2. Settings:  
   - **Runtime:** Docker  
   - **Root Directory:** `services/api` (or `NorthCare AI Project/services/api` if Git root is the parent folder)  
   - **Dockerfile Path:** `./Dockerfile`  
   - **Docker Build Context Directory:** `.`  
   - **Instance type:** Free (or paid if you must avoid cold starts)  
3. Leave the Docker start command alone — image runs `alembic upgrade head` then `uvicorn … --port ${PORT:-8000}` (Render sets `PORT`).

#### 3) Environment variables

| Key | Example / value |
|---|---|
| `NORTHCARE_ENV` | `development` |
| `DATABASE_URL` | Link from Postgres, or paste Internal URL |
| `DEV_AUTH_SECRET` | Long random (Generate / your own) |
| `CURSOR_SIGNING_SECRET` | Long random (different value) |
| `SYNC_PROTOCOL_VERSION` | `1` |
| `NORTHCARE_REACH_DEMO_ENABLED` | `true` |
| `NORTHCARE_REACH_AT_USSD_ENABLED` | `true` |
| `NORTHCARE_REACH_AT_USSD_MODE` | `sandbox` |
| `NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET` | Long random path secret |
| `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` | Exact AT code, e.g. `*384*91620#` |

Copy-paste block (fill secrets):

```env
NORTHCARE_ENV=development
DATABASE_URL=<paste Render Internal Database URL>
DEV_AUTH_SECRET=<generate-long-random>
CURSOR_SIGNING_SECRET=<generate-long-random>
SYNC_PROTOCOL_VERSION=1
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_REACH_AT_USSD_ENABLED=true
NORTHCARE_REACH_AT_USSD_MODE=sandbox
NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET=<generate-long-random>
NORTHCARE_REACH_AT_USSD_SERVICE_CODES=*384*91620#
```

Generate a secret locally (do not commit the output):

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 4) After deploy — health / docs

1. Wait for a green deploy.  
2. Open `https://<service-name>.onrender.com/` or `/health/live`.  
3. Optional OpenAPI: `https://<service-name>.onrender.com/docs`.  
4. Optional browser sim: `/reach-simulator` (demo gate must be on).

#### 5) Africa's Talking callback

```text
https://<service-name>.onrender.com/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>
```

Paste into AT **Sandbox** USSD callback URL. Service code in env must match AT exactly.

#### 6) Free tier spun-down warning

Free Render web services **sleep** when idle. First hit after sleep can take **1–3 minutes**. **2–3 minutes before the demo**, open `/health/live` in a browser to wake the service, then run AT simulator.

Optional Blueprint: **New** → **Blueprint** → path `services/api/render.yaml` (adjust if parent Git root). Set `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` in the Environment UI after create. Copy the generated callback secret for the AT URL.

### Backup — temporary tunnel to localhost

#### Option A — ngrok

```powershell
ngrok http 8000
```

Copy the `https://….ngrok-free.app` (or equivalent) host. Callback URL:

```text
https://<ngrok-host>/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>
```

If ngrok prompts for an auth token:

1. Create a free ngrok account and copy the token.  
2. Run `ngrok config add-authtoken <token>`.  
3. Re-run `ngrok http 8000`.

#### Option B — Cloudflare Tunnel (cloudflared)

```powershell
cloudflared tunnel --url http://127.0.0.1:8000
```

Use the printed `https://….trycloudflare.com` host the same way. Remember: this is **NorthCare’s** temporary bridge, not an AT product feature.

When the tunnel URL changes, update the AT dashboard callback.

## Paste into Africa's Talking

1. Open the AT **Sandbox** app → USSD channel (or create one).  
2. Set **callback URL** to the full HTTPS URL including the path secret.  
3. Ensure `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` matches the channel’s service code exactly.  
4. Use the AT **simulator** to dial the sandbox code — not a claim of live MNO dialling.

## Demo day playbook

### Preferred path (stable host)

Deploy steps, env checklist, and Fly.io / Railway CLI commands:  
[`REACH_HOSTED_SANDBOX_DEPLOY.md`](./REACH_HOSTED_SANDBOX_DEPLOY.md).

**Hosted config honesty:** use `NORTHCARE_ENV=development` on the demo host only so T1 can enable AT **sandbox** (`MODE=sandbox`). This is a **hosted sandbox backend**, not production telecom. Service code allowlist for this demo: `*384*91620#`.

1. Deploy `services/api` + Postgres (Fly: `fly.toml`; Railway: `railway.toml`) and set secrets from the deploy doc — never commit them.  
2. Confirm hosted API health (`GET /health/live` or `GET /`) over HTTPS.  
3. Build callback URL:  
   `https://<PUBLIC_HOST>/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>`  
4. **Update the Africa's Talking sandbox dashboard Callback URL** to that fixed HTTPS URL (replace any `trycloudflare.com` / ngrok host).  
5. Confirm `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` matches AT exactly (`*384*91620#` for the current sandbox channel).  
6. Smoke-test the **hosted** webhook POST (see below); expect `CON NORTHCARE REACH`.  
7. Dial `*384*91620#` in the AT web simulator and walk menus.  
8. Leave laptop tunnels **off** unless using them as backup.

### Backup path (cloudflared / ngrok)

1. Start Postgres + API on the laptop.  
2. Start tunnel; copy the **current** HTTPS host.  
3. Update AT callback URL to match (easy to forget if the URL changed).  
4. Smoke POST → `CON`; then AT simulator dial.  
5. Keep the tunnel process running for the entire demo; do not close the laptop lid / sleep if that kills the process.

### Pre-demo checklist

- [ ] AT callback URL matches the **live** public host + `/v1/reach/ussd/africas-talking/<secret>` (Render / Fly / Railway — see Render section above or `REACH_HOSTED_SANDBOX_DEPLOY.md`)  
- [ ] If Render Free: service woken via `/health/live` 2–3 minutes before demo  
- [ ] `NORTHCARE_REACH_AT_USSD_ENABLED=true`, `MODE=sandbox`, demo gate on, `NORTHCARE_ENV=development` (hosted sandbox honesty)  
- [ ] Service code allowlisted exactly as shown in AT (demo channel: `*384*91620#`)  
- [ ] Smoke POST returns body starting with `CON NORTHCARE REACH`  
- [ ] AT web simulator dial of sandbox code shows NorthCare menu (not stock AT page)  
- [ ] (Optional) Worker Expo app can list a newly created request if showing the full story  
- [ ] Honesty ready: sandbox ≠ national live shortcode; no SMS claimed unless separately staged  
- [ ] Laptop tunnel **not** required if hosted callback is healthy  

### If the stock Africa's Talking page appears

1. Assume the callback is unreachable or wrong — not “AT deleted NorthCare.”  
2. Check whether the tunnel/host process is still up.  
3. Hit the callback URL path with a smoke POST (or open API health) from another network.  
4. Re-copy the current tunnel HTTPS host into AT if using a quick tunnel.  
5. Confirm the path secret and service code still match env.  
6. If demo time is short: fall back to **R3 browser simulator** (`GET /reach-simulator`) and say clearly that AT sandbox needs a reachable API callback.

## Quick local POST smoke test

```powershell
$secret = "<CALLBACK_SECRET>"
$uri = "http://127.0.0.1:8000/v1/reach/ussd/africas-talking/$secret"
Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/x-www-form-urlencoded" -Body @{
  sessionId = "local-smoke-1"
  phoneNumber = "+233200000001"
  networkCode = "62002"
  serviceCode = "*384*XXXX#"   # must match SERVICE_CODES
  text = ""
}
```

Expect a plain-text body starting with `CON NORTHCARE REACH`.

Against a hosted/tunnel URL, use the same body with `https://<PUBLIC_HOST>/v1/reach/ussd/africas-talking/$secret`.

## Keep working in parallel

- Browser R3 simulator: `GET /reach-simulator` (still gated by `NORTHCARE_REACH_DEMO_ENABLED`).  
- Creates from AT use channel `ussdAfricasTalkingSandbox`; simulator continues to use `ussdSimulator`.

## Ask NorthCare on community USSD (menu 7) — FAQ-only hackathon slice

Implemented as **approved FAQ templates + optional worker follow-up**, not a generative clinical chatbot:

- Main menu **7. Ask NorthCare** on AT sandbox engine and browser Reach simulator.  
- Answers come from `services/api/src/northcare_api/reach/ussd_at/ask_faq.py` (English community info: what Reach is, how to request CHPS, status PIN, hours variability, emergency dial 112).  
- Free text is keyword-matched to that pack only; no LLM; no on-device Qwen.  
- Every answer includes: not a diagnosis; emergencies call 112; for care talk to a health worker.  
- Unmatched questions offer the existing CHPS create flow (`generalChps` / `routine`) — never auto-create from the question alone.  
- Worker-side Ask NorthCare in the mobile app remains a **separate** surface (Stage 13 / Offline AI).  

Checkpoint: `docs/development/REACH_USSD_ASK_NORTHCARE_CHECKPOINT.md`. Do **not** claim generative medical AI on USSD or enable a live shortcode from this feature.

## Fail-closed reminders

- Flags default **off**.  
- Staging/production refuse AT USSD enablement.  
- `NORTHCARE_REACH_AT_USSD_MODE=live` is rejected in T1.  
- Do not log or commit the callback secret, status PINs, or full phone numbers.  
- Do not start Stage 19 or claim a live Ghana shortcode from this runbook.
