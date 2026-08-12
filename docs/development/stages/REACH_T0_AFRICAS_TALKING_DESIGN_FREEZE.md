# Reach Stage T0 — Africa's Talking USSD Design Freeze

**Status:** Approved (2026-08-04)  
**Honesty label:** Design / planning only. No FastAPI webhook, no live shortcode, no production telecom claim.  
**Date:** 2026-08-04  
**Track:** NorthCare Reach — Phase 2 partner sandbox (net-new after R0–R6)  
**Depends on:** Reach R0–R6 complete (simulated USSD and community-request backend)  
**Next stage:** T1 — Africa's Talking Webhook Adapter (**do not start until explicit T1 coding authorisation + AT sandbox ready**)  
**Checkpoint:** `docs/development/REACH_AT_USSD_T0_T1_DOCS_CHECKPOINT.md`

## Purpose

Freeze the design for connecting NorthCare Reach to **Africa's Talking (AT)** as the USSD aggregator partner — sandbox first — without implementing application code in this stage.

T0 answers: how NorthCare obtains AT access, how AT sessions map to the frozen Reach menus, which channel enum values to add later, webhook threat model, and product-truthfulness rules.

## Partner

| Field | Value |
|---|---|
| Partner | Africa's Talking |
| Product used | USSD API (sandbox → later live shortcode) |
| NorthCare product claim until provisioned | **Simulation / sandbox only** — never claim a live Ghana shortcode |
| Brand assets | Do **not** forge or display AT / MNO / UNICEF / GHS logos as partnership marks without authorised assets |

Africa's Talking is a planned **integration vendor**, not an implemented production partnership in the shipped app today.

## Included in T0

- Partner sandbox onboarding path (documented steps + official help links)  
- Ghana-aware path from sandbox toward production (fees and MNO approval noted honestly)  
- Session model mapping AT `sessionId` / `text` to frozen Reach menus  
- Proposed channel enum extension (keep `ussdSimulator`)  
- Webhook threat model and logging / privacy rules  
- Product truthfulness rules for UI, demo copy, and judge materials  
- Explicit non-goals and gate for T1  

## Excluded from T0

- FastAPI webhook implementation  
- Database / Alembic channel migrations  
- OpenAPI changes  
- ngrok or hosted endpoint setup in code  
- Live shortcode application submission (human/ops action, not this stage)  
- SMS, voice, airtime, payments  
- Dagbanli or other language implementations  
- Auto client create, AI, diagnose / prescribe / dosage  
- Starting T1 or Stage 19  

---

## 1. How to obtain sandbox and path to production (Ghana-aware)

Official AT documentation evolves. Prefer AT help and dashboard pages over third-party blogs. Confirm every commercial figure on the **current Ghana rate card with Africa's Talking** before budgeting or promising timelines.

### 1.1 Sandbox (development / free testing)

Typical path (confirm against current AT help pages at implementation time):

1. Create or sign in to an Africa's Talking account.  
2. Open the **Sandbox** application.  
3. Create a **USSD channel** in the sandbox and set a **callback URL** (webhook) that AT can reach over HTTPS.  
4. For local development, expose the NorthCare API with a tunnel (e.g. ngrok) and paste that public HTTPS URL into the AT USSD callback field.  
5. Exercise menus with the AT **simulator** (not a claim of live MNO shortcode traffic).

**Authoritative starting points (verify if URLs move):**

| Topic | Link |
|---|---|
| Sandbox getting started | https://help.africastalking.com/en/articles/1170660-how-do-i-get-started-on-the-africa-s-talking-sandbox |
| Products by country (includes Ghana USSD) | https://help.africastalking.com/en/articles/2727792-which-countries-are-africa-s-talking-products-in |
| USSD product overview | https://africastalking.com/ussd |
| Developer docs portal | https://developers.africastalking.com/ |
| Sandbox USSD channel create (legacy portal path; confirm in dashboard) | https://sandbox.africastalking.com/ussd/createchannel |
| Simulator (legacy port path; confirm in dashboard) | https://simulator.africastalking.com:1517 |
| General contact | info@africastalking.com |

### 1.2 Path toward Ghana production (not T0 or T1 code)

Africa's Talking lists **Ghana** among countries where **USSD** is a live product. Moving from sandbox to a real shortcode is an **ops + commercial + MNO approval** track, not a code merge:

1. Complete sandbox menu validation against frozen Reach flows.  
2. Engage AT on **Ghana** shared or dedicated USSD options, billing, and wallet / deposit requirements.  
3. **Confirm the current Ghana rate card with AT** (setup, monthly maintenance, per-session charges, deposits). Do **not** publish invented or scraped GHS/USD figures from unofficial blogs.  
4. Expect **MNO approval / whitelisting** for operators serving Ghana (historically discussed in public AT materials alongside MTN and other networks — exact operator list and lead times must come from AT).  
5. Provision a **stable HTTPS callback** on a NorthCare-controlled host (not a disposable ngrok URL).  
6. Only after AT confirms the live code is active may NorthCare claim a live shortcode in product or demo copy.  

**Honesty:** T0/T1 do not grant national telecom approval, GHS clinical content approval, or partnership logos.

---

## 2. Session model vs existing Reach menus

Frozen menus remain the source of truth:

- Product: `docs/product/NORTHCARE_REACH_USSD_FLOW.md`  
- Machine-readable: `implementation/reach-ussd-flow.json`  
- R3 reference implementation: browser simulator at gated `GET /reach-simulator`

### 2.1 Africa's Talking request fields (expected)

AT sends an HTTP **POST** (`application/x-www-form-urlencoded`) to the registered callback. Expected fields (confirm against current AT USSD docs):

| Field | Role |
|---|---|
| `sessionId` | Stable id for one dial-in session |
| `serviceCode` | USSD code / channel being dialled |
| `phoneNumber` | Subscriber MSISDN (treat as sensitive contact data) |
| `text` | Empty on first request; thereafter user inputs joined with `*` (e.g. `4*1*...`) |
| `networkCode` | Operator network identifier when provided |

### 2.2 Africa's Talking response contract

- Response body: **plain text**  
- Continuesession: prefix `CON` + menu text  
- Terminate session: prefix `END` + final text  
- Malformed responses or HTTP client errors typically cause AT to end the session  

### 2.3 Mapping to frozen Reach navigation

| AT concern | Reach mapping |
|---|---|
| Empty `text` | Show main menu `NORTHCARE REACH` options `0`–`6` |
| Latest segment of `text` (split on `*`) | Current choice under frozen submenu |
| Navigation `0` | Emergency help (where session design permits) |
| Navigation `9` | Back |
| Request create leaf | Call existing create service (`POST /v1/reach/requests` semantics) with proposed AT channel enum |
| Status check leaf | Call existing status service (`POST /v1/reach/requests/status` semantics) |
| One-time status PIN | Show only in session response once; never log; never put in URL |

Session state should be keyed by AT `sessionId` (plus service code). Prefer reconstructing position from full `text` when possible so restarts behave like the R3 simulator.

### 2.4 Labelling

Until a live shortcode is provisioned:

- Sandbox / adapter copy must remain honest: **Africa's Talking sandbox** or **integration pending**, not “live NorthCare shortcode on all Ghana networks”.  
- Emergency copy still leads with **call 112**; no ambulance-dispatched claims.  
- Health submenu items 1–5 remain **unapproved demonstration content** unless later stages replace them with approved packs.

### 2.5 English only (unchanged)

Interface language remains **English**. Dagbanli / Hausa / Dagaare stay planned; do not fabricate translations.

---

## 3. Channel enum proposal

Today MVP / R2–R6 store only:

- `ussdSimulator`

**Proposed additive values for a future implementation stage (T1+), keep existing value:**

| Value | Meaning | When allowed |
|---|---|---|
| `ussdSimulator` | Browser FastAPI static simulator (R3) | Existing demo gate |
| `ussdAfricasTalkingSandbox` | Requests created via AT sandbox / simulator webhook | T1 sandbox-only flags |
| `ussdAfricasTalkingLive` | Requests created via provisioned live shortcode | Post-pilot enablement only; **not** in T1 |

Rules:

- Do **not** remove or rename `ussdSimulator`.  
- Demo reset CLIs that delete `ussdSimulator` rows must **not** silently delete AT channels unless an explicit later stage says so.  
- Public create validation must reject `ussdAfricasTalkingLive` until a separate approved stage enables it.  
- Schema / Alembic / OpenAPI updates happen in **T1+ code stages**, not in T0.

---

## 4. Webhook threat model

The AT callback URL is a **publicly callable** surface. Treat it like other Reach public endpoints (`docs/security/NORTHCARE_REACH_PUBLIC_ENDPOINT_BOUNDARY.md`), plus aggregator-specific risks.

| Threat | Mitigation (design) |
|---|---|
| Callback URL leak / guessing | Long unguessable path secret; rotate if exposed; prefer env-configured secret segment; never commit the secret |
| Spoofed POSTs pretending to be AT | Prefer shared secret in path or header if AT supports it; **IP allowlist if AT documents stable egress IPs** (confirm with AT — do not invent ranges); rate limits; reject unexpected `serviceCode` |
| Session hijack / replay | Bind state to `sessionId`; short TTL; do not trust client-supplied organisation/facility |
| PIN / health data logging | Never log full POST bodies, status PINs, free-text health concerns, or full QR payloads; redact `phoneNumber` in logs |
| Abuse of status lookup | Reuse R2 PIN hash, lockout, and rate-limit patterns |
| Open redirect of tunnel URLs | Dev ngrok URLs are temporary; production must use controlled HTTPS host |
| Over-collection | Collect only frozen Reach fields; no GPS scraping, no symptom AI, no auto client create |
| Cross-tenant leakage | Server-controlled org/facility (same as R2 demo scope rules unless a later stage expands) |

**Fail closed:** If sandbox enablement flags are off, or environment is staging/production without explicit later approval, the AT USSD adapter must not accept sessions.

---

## 5. Product truthfulness

| Claim | Allowed when |
|---|---|
| “USSD simulation” / “AT sandbox integration in progress” | Yes, when accurate |
| “Dial \*XXX# on live Ghana networks for NorthCare Reach” | Only after AT confirms a provisioned live code |
| AT / MNO / UNICEF partnership branding | Only with authorised assets and truthful relationship |
| Ambulance dispatched / emergency medically confirmed | Never (R0 safety freeze) |
| Diagnosing or prescribing via USSD | Never |

Judge scripts, README, and mobile UI must not get ahead of provisioning.

---

## 6. Explicit non-goals (T0 and forward constraints)

- Automatic NorthCare **client** creation from USSD  
- Automatic **referral** creation from USSD  
- Generative **AI** in public USSD flows  
- Diagnose / prescribe / dosage / invented medical or Dagbanli content  
- Live ambulance / National Ambulance Service data exchange  
- SMS gateway work (separate Phase 2 item)  
- Claiming national GHS clinical approval  

---

## 7. Design decisions frozen in T0

| # | Question | Answer |
|---|---|---|
| 1 | Aggregator partner for Phase 2 USSD? | Africa's Talking |
| 2 | Implement webhook in T0? | No — docs only |
| 3 | Keep `ussdSimulator`? | Yes |
| 4 | Proposed sandbox channel? | `ussdAfricasTalkingSandbox` |
| 5 | Proposed live channel? | `ussdAfricasTalkingLive` (post-T1; gated) |
| 6 | Menu source of truth? | `NORTHCARE_REACH_USSD_FLOW.md` / `reach-ussd-flow.json` |
| 7 | Create/status backend? | Reuse R2 Reach services |
| 8 | Ghana fees in docs? | Direct readers to confirm current Ghana rate card with AT |
| 9 | Live shortcode claim before provisioned? | Forbidden |
| 10 | Auto client / AI / diagnose? | Forbidden |
| 11 | Language for AT flows? | English only for now |
| 12 | May T1 start before T0 approval? | **No** |

---

## 8. Exit criteria

T0 is complete (docs) when:

1. This stage file is reviewed.  
2. Channel enum proposal is accepted or explicitly amended.  
3. Threat model and truthfulness rules are accepted.  
4. Checkpoint `docs/development/REACH_AT_USSD_T0_T1_DOCS_CHECKPOINT.md` is approved.  

Then — and only then — T1 may be scheduled. **Do not auto-start T1.**
