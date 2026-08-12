# Reach Stage T1 — Africa's Talking Webhook Adapter

**Status:** Implemented — awaiting checkpoint approval  
**Honesty label:** Sandbox-only Africa's Talking USSD webhook adapter (T1). No live shortcode.  
**Date:** 2026-08-04  
**Implemented:** 2026-08-04  
**Checkpoint:** `docs/development/REACH_T1_AFRICAS_TALKING_CHECKPOINT.md`  
**Track:** NorthCare Reach — Phase 2 partner sandbox  
**Depends on:** **T0 approved**; Reach R2 create/status services available; R3 simulator remains as parallel demo channel  
**Does not include:** Live shortcode enablement (`ussdAfricasTalkingLive`), SMS, Stage 19, auto client create, AI  
**Prerequisite stage:** `docs/development/stages/REACH_T0_AFRICAS_TALKING_DESIGN_FREEZE.md`  
**Checkpoint (docs package):** `docs/development/REACH_AT_USSD_T0_T1_DOCS_CHECKPOINT.md`

## Gate

**Do not start T1 coding until T0 is approved.**

Human / ops checklist before coding is useful (may proceed in parallel with review, but not as a substitute for T0 approval):

1. Africa's Talking sandbox account exists.  
2. Sandbox USSD channel created.  
3. Callback URL field known (will point at ngrok or hosted HTTPS after the adapter exists).  
4. Team understands AT POST → `CON`/`END` contract (see T0).  

## Purpose

Add a **FastAPI webhook** that accepts Africa's Talking USSD POST callbacks, drives the frozen Reach menu session model, and maps request-create / status-check leaves onto the **existing** R2 Reach services — **sandbox-only** by default.

## Included in T1

- FastAPI route accepting AT form-encoded USSD POST  
- Session handling keyed by AT `sessionId` (+ service code)  
- Menu behaviour aligned with `docs/product/NORTHCARE_REACH_USSD_FLOW.md` and `implementation/reach-ussd-flow.json`  
- Mapping create leaves → existing create service / `POST /v1/reach/requests` semantics with channel `ussdAfricasTalkingSandbox`  
- Mapping status leaves → existing status service / `POST /v1/reach/requests/status` semantics  
- Sandbox-only enablement flags (fail closed)  
- Developer procedure for ngrok / local HTTPS tunnel  
- Threat mitigations from T0 that are implementable in-app (secret path segment, serviceCode allowlist, rate limits where practical, redacted logging)  
- Alembic / schema / OpenAPI updates only as needed to accept the new **sandbox** channel value  
- Unit and integration tests outlined below  
- Docs update for local AT sandbox testing  

## Excluded from T1

- Enabling `ussdAfricasTalkingLive`  
- Claiming a provisioned national shortcode  
- SMS / voice / airtime  
- Changing R3 simulator behaviour except optional cross-links in docs  
- Mobile UI redesign for AT  
- Dagbanli implementation  
- Auto client create, auto referral, AI triage, diagnose / prescribe / dosage  
- Production Ghana MNO commercial contracts (ops track)  
- Partner logo packaging  

---

## 1. FastAPI webhook — AT USSD POST contract

### 1.1 Proposed route (illustrative; exact path frozen at implementation)

Example shapes (pick one during implementation and document in OpenAPI):

- `POST /v1/reach/ussd/africas-talking/{callbackSecret}`  
- or `POST /v1/reach/ussd/at` with an additional configured secret header/path  

Response:

- `Content-Type: text/plain`  
- Body starts with `CON` or `END`  

### 1.2 Request parsing

Read form fields (names per AT docs / T0):

- `sessionId`, `phoneNumber`, `serviceCode`, `text`, and `networkCode` when present  

Reject or end session when:

- Feature flags disabled  
- `serviceCode` not in configured allowlist  
- Payload too large / text too long  
- Unknown or abusive patterns  

### 1.3 Response rules

- Prefer short USSD-safe screens (avoid exotic Unicode that networks strip).  
- Preserve R0 emergency honesty: 112 first; no ambulance-dispatch claims.  
- Show one-time status PIN only in the `END` (or final `CON` step) that creates the request; never echo later.  
- Label sandbox sessions honestly where space allows (e.g. short “Sandbox” / “Demo content” note without overflowing the screen).

---

## 2. Map to existing Reach create / status services

Do **not** invent a second community-request write path.

| USSD leaf | Existing behaviour to reuse |
|---|---|
| CHPS / category request create | Same validation and persistence as R2 create |
| Emergency create options 2–3 | Same emergency categories / types; simulation wording |
| Status check | Reference + PIN → generic public status labels only |
| Org / facility | Server-controlled demo (or later configured) scope — caller must not pick arbitrary tenants |

Channel value for successful creates under T1:

- `ussdAfricasTalkingSandbox`

Keep `ussdSimulator` for the browser simulator.

Internal implementation may call service functions directly (preferred) rather than HTTP-loopback to itself.

---

## 3. Sandbox-only enablement flags

Proposed settings (names indicative — align with existing `NORTHCARE_*` style at implementation):

| Flag | Intent |
|---|---|
| `NORTHCARE_REACH_AT_USSD_ENABLED` | Master switch for AT USSD adapter (default `false`) |
| `NORTHCARE_REACH_AT_USSD_MODE=sandbox` | Only `sandbox` allowed in T1; `live` rejected |
| `NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET` | Path/header secret (never commit; never log) |
| `NORTHCARE_REACH_AT_USSD_SERVICE_CODES` | Comma-separated allowlist of sandbox service codes |
| Existing `NORTHCARE_REACH_DEMO_ENABLED` / env rules | Retain; compose fail-closed rules so staging/production cannot casually open public AT USSD |

**T1 rule:** `live` mode and channel `ussdAfricasTalkingLive` remain unavailable.

---

## 4. ngrok / local tunnel for development

Developer flow (docs-only here; no code in this stage package):

1. Run NorthCare API locally with sandbox AT flags enabled in a development environment only.  
2. Start an HTTPS tunnel (e.g. ngrok) to the local API port.  
3. Set the AT sandbox USSD callback URL to the public tunnel + webhook path including secret.  
4. Use the AT simulator to dial the sandbox channel.  
5. Rotate/replace tunnel URLs when they change; update the AT dashboard callback each time.  

Never commit ngrok auth tokens or AT API keys. Never print secrets in checkpoints.

---

## 5. Acceptance criteria

T1 is done only when all of the following hold:

1. AT sandbox simulator can complete main-menu flows `0`–`6` against the webhook with English copy aligned to the freeze (placeholders still labelled where applicable).  
2. Creating a CHPS / category request persists with channel `ussdAfricasTalkingSandbox` and returns reference + one-time PIN once.  
3. Status check returns only privacy-safe generic labels.  
4. Emergency option 1 instructs dialling 112 and creates **no** request; options 2–3 create with correct types and honest simulation wording.  
5. With flags off, AT POSTs fail closed (no session menus that write requests).  
6. `ussdSimulator` path still works for R3.  
7. No PIN, full phone, or health free-text appears in application logs at info level.  
8. Automated tests for adapter parsing, CON/END shaping, flag gates, and create/status mapping pass.  
9. Docs describe dashboard callback setup and local tunnel steps.  
10. Product copy still does **not** claim a live Ghana shortcode.

---

## 6. Tests outline (for the coding stage)

| Layer | Coverage |
|---|---|
| Unit | Parse AT form → session steps; `text` split on `*`; CON/END builders; redaction helpers |
| Unit | Flag matrix: disabled / sandbox-only / live-rejected |
| Integration | Webhook POST → create service → DB row with `ussdAfricasTalkingSandbox` |
| Integration | Webhook status path → generic labels; bad PIN lockout still applies |
| Integration | Unknown `serviceCode` rejected |
| Regression | R3 simulator and existing Reach worker APIs unchanged |
| Negative | Oversized body; missing fields; flags off; secret wrong |

No real MSISDNs or production AT credentials in fixtures — synthetic numbers only.

---

## 7. Explicit non-goals (reminder)

- Auto client create  
- Auto referral  
- AI / diagnose / prescribe / dosage  
- Live channel enablement  
- Invented medical or Dagbanli content  
- National approval claims  

---

## Exit

Checkpoint for the **coding** stage will be produced when T1 is implemented. This file only specifies the stage.

**Stop after T1.** Do not auto-start live shortcode enablement or Stage 19.
