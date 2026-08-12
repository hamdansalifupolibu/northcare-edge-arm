# Reach T1 Checkpoint — Africa's Talking Webhook Adapter (sandbox)

**Stage:** Reach T1 — Africa's Talking Webhook Adapter  
**Status:** Complete — awaiting approval  
**Scope approved:** Authorised “Authorise T1 now” (build real NorthCare webhook + HTTPS URL for AT dashboard)  
**Date:** 2026-08-04  
**Spec:** `docs/development/stages/REACH_T1_AFRICAS_TALKING_WEBHOOK_ADAPTER.md`  
**Runbook:** `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`

## What was implemented

- FastAPI webhook `POST /v1/reach/ussd/africas-talking/{callbackSecret}` accepting AT `application/x-www-form-urlencoded` USSD POSTs (`sessionId`, `phoneNumber`, `networkCode`, `serviceCode`, `text`).
- Plain-text `CON` / `END` responses with English menus aligned to frozen Reach USSD flow.
- Create/status leaves call existing Reach services with channel `ussdAfricasTalkingSandbox`.
- Alembic **0006** expands `ck_community_requests_channel` to allow `ussdAfricasTalkingSandbox` (live channel still not in DB allowlist).
- Sandbox-only settings gates; `MODE=live` and channel `ussdAfricasTalkingLive` rejected; R3 `ussdSimulator` unchanged.
- Redacted logging (masked phone / session; no PIN / health free-text at info).
- Unit + integration tests; developer ngrok/tunnel runbook; OpenAPI / schema / roadmap / PROJECT_STATUS updates.

## Files created

- `services/api/src/northcare_api/reach/ussd_at/__init__.py`
- `services/api/src/northcare_api/reach/ussd_at/adapter.py`
- `services/api/src/northcare_api/reach/ussd_at/menus.py`
- `services/api/src/northcare_api/reach/ussd_at/redaction.py`
- `services/api/src/northcare_api/reach/ussd_at/response.py`
- `services/api/src/northcare_api/reach/ussd_at/routes.py`
- `services/api/src/northcare_api/reach/ussd_at/session_store.py`
- `services/api/alembic/versions/0006_at_ussd_sandbox_channel.py`
- `services/api/tests/integration/test_reach_at_ussd_webhook.py`
- `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`
- `docs/development/REACH_T1_AFRICAS_TALKING_CHECKPOINT.md`

## Files modified

- `services/api/src/northcare_api/config.py`
- `services/api/src/northcare_api/main.py`
- `services/api/src/northcare_api/reach/__init__.py`
- `services/api/src/northcare_api/reach/enums.py`
- `services/api/src/northcare_api/reach/schemas.py`
- `services/api/src/northcare_api/reach/validation.py`
- `services/api/.env.example`
- `implementation/community-request-schema.json`
- `implementation/reach-roadmap.json`
- `implementation/openapi.json` (regenerated)
- `PROJECT_STATUS.md`
- `docs/development/stages/REACH_T1_AFRICAS_TALKING_WEBHOOK_ADAPTER.md`

## Files deleted

- None

## Commands run

```text
pytest tests/unit/test_reach_at_ussd_adapter.py tests/integration/test_reach_at_ussd_webhook.py
# OpenAPI regenerate via FastAPI app.openapi()
# Local API + HTTPS tunnel per runbook (when tooling available)
```

## Packages installed

- `python-multipart` (required for AT `application/x-www-form-urlencoded` form parsing)

## Results

| Check | Result |
|---|---|
| Type-check | N/A (Python API) |
| Lint | Not run project-wide |
| Tests | **17 passed** (`test_reach_at_ussd_adapter` + `test_reach_at_ussd_webhook`) |
| Android emulator | N/A (API stage) |
| Local webhook smoke | `CON NORTHCARE REACH` on T1 uvicorn |
| Public tunnel smoke | Cloudflare quick tunnel returned `CON` successfully |

## Stitch screens covered

- None (backend / telecom adapter)

## Offline behaviour

- Unchanged for mobile clinical flows. AT USSD itself is online (aggregator callback).

## Accessibility review

- N/A for webhook plain-text AT surface.

## Security and privacy review

- Secrets committed? **No** (placeholder in `.env.example` only)  
- Real patient data? **No** (synthetic fixtures / demo phones)  
- Callback path secret required; wrong secret → 401  
- Service-code allowlist; flags fail closed outside development/test  
- Live mode rejected at settings load  
- Logs redact phone and session identifiers; do not log PINs or landmarks

## Known limitations

- In-memory session store (single API process; not multi-replica).  
- Tunnel URLs are temporary; update AT dashboard when they change. Cloudflare quick tunnel is NorthCare’s bridge, not AT. Prefer stable hosted API for demo day.  
- Not a live Ghana shortcode.  
- English only.  
- No SMS / live channel / Stage 19.  
- Community “Ask NorthCare” on USSD was listed as future-only in T1; a later **FAQ-only** hackathon slice added menu 7 (see `REACH_USSD_ASK_NORTHCARE_CHECKPOINT.md`). Not generative clinical AI.

## Outstanding tasks

- Human: paste callback URL into AT dashboard; confirm sandbox service code in `SERVICE_CODES`.  
- Manual AT simulator walkthrough of menus 0–6.  
- Checkpoint approval before any live enablement work.

## Unexpected changes

- None beyond T1 scope.

## Git status

```text
(see working tree after implementation; commit only when requested)
```

## Checkpoint decision

**Awaiting human approval.** Do not start live shortcode enablement or Stage 19.
