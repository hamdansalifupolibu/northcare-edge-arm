# NorthCare Reach — Public Endpoint Boundary

**Status:** Frozen by Reach Stage R0; **public endpoints implemented in R2**; **USSD simulator UI in R3**; **AT sandbox webhook in T1** (development gates)  
**Last updated:** 2026-08-04  
**Contract:** `implementation/reach-api-contract-draft.json` · live OpenAPI `implementation/openapi.json`

## Public endpoints (R2 — gated)

- `POST /v1/reach/requests`  
- `POST /v1/reach/requests/status`  

## Simulator UI (R3 — gated)

- `GET /reach-simulator`  
- `GET /reach-simulator/{asset_name}` (allow-listed: `index.html`, `reach.css`, `reach.js`)  

Require `NORTHCARE_REACH_DEMO_ENABLED=true` in `development`/`test` only. Staging/production cannot enable the gate.

## Africa's Talking USSD webhook (T1 — gated)

- `POST /v1/reach/ussd/africas-talking/{callbackSecret}`  

Requires Reach demo gate **plus** `NORTHCARE_REACH_AT_USSD_*` sandbox flags. Sandbox only; live mode rejected. Public tunnels (Cloudflare quick tunnel / ngrok) are operator infrastructure, not AT. Prefer a stable HTTPS host for demo reliability — see `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`.
## Implementation requirements (R2+)

- Strict request schemas  
- Request-size limits  
- Text-length limits  
- Phone-number validation  
- Generic errors (no account enumeration)  
- No clinical diagnosis in responses  
- Status lookup requires reference **plus** PIN  
- Brute-force protection on status PIN  
- Rate limiting before public deployment  
- Abuse monitoring before public deployment  
- No raw request-body logging  
- No status PIN logging  
- No detailed health information in responses  
- No cross-organisation data exposure  

## Hackathon simulator honesty

For the hackathon simulator:

- Synthetic data only  
- Restrict to development / simulator environment  
- Clearly mark as development / simulation  
- Do **not** claim production public-endpoint security  

Rate limiting and abuse protection are documented requirements for implementation stages; they are not claimed as complete for production hosting.

See also `docs/security/NORTHCARE_REACH_SIMULATOR_SECURITY.md`.
