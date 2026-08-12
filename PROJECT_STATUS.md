# PROJECT_STATUS.md

**Last reviewed:** 2026-08-11  
**Product:** NorthCare AI  
**Extension track:** NorthCare Reach  
**Arm track:** NorthCare Edge (local optimization layer — not a clinical rewrite)  
**New-chat bootstrap:** [`docs/development/IMPLEMENTATION_HANDOFF.md`](docs/development/IMPLEMENTATION_HANDOFF.md)

## Current stage

**NorthCare Edge — optimization COMPLETE + PROMOTED + fixture quality scoring** — trail [`docs/arm/BASELINE_TO_DONE_TRAIL.md`](docs/arm/BASELINE_TO_DONE_TRAIL.md). Baseline 53.96 s → 26.5 s (−53.8% Whisper). Fixture accuracy **100/100** on base and tiny (`fixture_combined_v1`). Production uses **`ggml-tiny.en.bin`**.

**Offline AI Stage 1 — Native Runtime, Model Provisioning and Real Offline Inference** — **COMPLETE** (S20 Ultra online + airplane-mode `OFFLINE_MODEL_READY` evidence captured)

Core application: **Stages 1–18 complete**. Reach R0–R6 complete (manual validation pending). **Stage 19 intentionally paused**. Offline AI Stage 2 Ask NorthCare wiring is a separate track and must not be undone by Stage 1 harness work. The project is **not** declared production ready.

### NorthCare Edge (Arm) — status

| Phase | Status |
|---|---|
| Phase 1 Freeze foundation | **Complete** |
| Phase 2 Instrumentation | **Complete** |
| Phase 3 S20 Ultra baseline | **Complete** — `edge_msp5nrdb_2sfe` (53.96 s) |
| Phase 4 Bottleneck | **Complete** — Whisper transcribe dominates (~83%) |
| Phases 5–8 Optimize under quality gate | **Complete** — EXP-01–03 rejected; EXP-06 accepted |
| Phase 9 Edge Lab UI | **Complete + polished** (preflight, bars, history, More entry) |
| Phase 10 Docs / README skeleton | **Complete** + measured Before→After |
| Production promotion (tiny.en) | **Complete** — `whisper-model-manifest.json` |
| Phases 11–12 Public repo / submit | Later (licence first) |

Docs: [`docs/arm/README.md`](docs/arm/README.md). Open lab: **More → Edge Lab** (diagnostics) or `/(development)/edge-lab`.

## Completed stages / milestones

| Milestone | Status |
|---|---|
| Project orientation / product docs | Complete |
| Stitch connection and design ingestion | Complete |
| Implementation roadmap planning | Complete |
| Asset audit | Complete |
| Asset organisation (+ close-out) | Complete |
| Stage 1 repository foundation | Complete |
| Stage 2 Expo Android foundation | Complete |
| Stage 3 design tokens + components | Complete |
| Stage 4 navigation / splash / onboarding / shells | Complete |
| Stage 5 authentication / secure local access | Complete |
| Stage 6 domain models / SQLite / repositories | Complete |
| Stage 7 client management vertical slice | Complete |
| Stage 8 visits and guided screening | Complete |
| Stage 9 deterministic risk and priority engine | Complete |
| Stage 10 referrals and QR referral passport | Complete |
| Stage 11 voice-to-care capture and structured extraction | Complete |
| Stage 12 nutrition assessment and reviewed guidance | Complete |
| Stage 13 Ask NorthCare constrained assistant | Complete |
| Stage 14 Backend, synchronisation and conflict resolution | Validated |
| Stage 15 Notifications and follow-up reminders | Complete |
| Stage 16 Administration and account provisioning | Complete |
| Stage 17 Full UI/UX integration, Stitch fidelity and motion | Complete |
| Stage 18 Accessibility, security and quality hardening | Complete |
| Reach R0 Scope, safety and design freeze | Complete |
| Reach R1 Worker profession and admin integration | Complete |
| Reach R2 Community request backend and routing | Complete |
| Reach R3 USSD Simulator | Complete |
| Reach R4 Worker Community Requests Centre | Complete |
| Reach R5 Emergency Coordination Simulation | Complete |
| Reach R6 Integration and demonstration preparation | **Complete — ready for manual validation** |

Honest core sequence: 1–18 complete → **Stage 19 paused** → Reach R0 → R1 → R2 → R3 → R4 → R5 → **R6**.

## Next proposed stage

**Manual validation of Reach R6**, then a human decision whether to resume **STAGE 19**.  
**STAGE 19** remains **PAUSED**. Do not start Stage 19 automatically.

### Reach Phase 2 — Africa's Talking USSD

| Stage | Status |
|---|---|
| **T0** Africa's Talking USSD design freeze | **Approved** (2026-08-04) — docs only (`docs/development/stages/REACH_T0_AFRICAS_TALKING_DESIGN_FREEZE.md`) |
| **T1** Africa's Talking webhook adapter (sandbox) | **Complete — awaiting checkpoint approval** (`docs/development/REACH_T1_AFRICAS_TALKING_CHECKPOINT.md`) |

T1 adds sandbox-only `POST /v1/reach/ussd/africas-talking/{callbackSecret}`. Channel `ussdAfricasTalkingSandbox` only. Live shortcode / `ussdAfricasTalkingLive` remain unavailable. R3 `ussdSimulator` unchanged.

**Hosted USSD sandbox (working):** API + Postgres on Render at `https://northcare-api.onrender.com` — stable HTTPS callback for AT sandbox dial (demo service code `*384*91620#`). Free tier sleeps; wake `/health/live` before demos. Still **sandbox only**, not a national live shortcode. Cloudflare/ngrok laptop tunnels are backup only. Runbook: `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`. Overview: root `README.md` § NorthCare Reach — USSD.

**Ask NorthCare on USSD (hackathon FAQ slice):** Menu **7** — approved community FAQ + worker handoff only (no LLM). Checkpoint: `docs/development/REACH_USSD_ASK_NORTHCARE_CHECKPOINT.md`. Stage 19 remains paused.

### Referrals — implemented vs planned

| Area | Status |
|---|---|
| Stage 10 create / track / opaque QR / local scan | Complete |
| Referrals inbox (open/overdue + next step) + create→QR UX | Complete |
| Signed offline-verifiable QR + verify screen + shareable slip | **Complete (Ed25519)** |
| Verify success popup + printable PDF caregiver slip | **Complete (safe ExpoPrint probe + create/verify congrats)** |
| Cross-facility referral inbox sync | Future (not this slice) |

## NorthCare Reach (hackathon extension)

Five connected MVP capabilities (frozen in R0) are implemented through R5 and packaged in R6:

1. Simulated USSD interface  
2. Community Request backend  
3. Profession information in administrator worker registration  
4. Community Requests Centre in the Worker workspace  
5. Emergency-coordination simulation  

R6 adds demo reset/seed CLIs, runbook, judge materials, E2E packaging tests, architecture Mermaid, and an honest validation matrix. No live telecom/ambulance/push features were added.

Authoritative Reach docs: `docs/product/NORTHCARE_REACH_MVP.md`, `docs/development/stages/REACH_R6_INTEGRATION_AND_DEMO.md`, `docs/development/REACH_R6_CHECKPOINT.md`, `implementation/reach-roadmap.json`. Phase 2 AT USSD stage specs: `docs/development/stages/REACH_T0_AFRICAS_TALKING_DESIGN_FREEZE.md`, `docs/development/stages/REACH_T1_AFRICAS_TALKING_WEBHOOK_ADAPTER.md`.

| Reach stage | Status |
|---|---|
| R0 Scope, Safety and Design Freeze | Complete |
| R1 Worker Profession and Admin Integration | Complete |
| R2 Community Request Backend and Routing | Complete |
| R3 USSD Simulator | Complete |
| R4 Worker Community Requests Centre | Complete |
| R5 Emergency Coordination Simulation | Complete |
| R6 Integration, Testing and Demonstration Preparation | **Complete — ready for manual validation** |
| T0 Africa's Talking USSD design freeze | **Approved** (2026-08-04) — docs only (no code) |
| T1 Africa's Talking webhook adapter (sandbox) | **Complete — awaiting checkpoint approval** |

## Application implementation status

Worker-authenticated offline client management through Ask NorthCare remains local-first on SQLite. Stages 1–18 behaviour is preserved. Reach Community Requests remain online-required (no SQLite request repository).

| Layer | Location / version |
|---|---|
| Mobile | `apps/mobile/` — Expo SDK ~57 |
| API | `services/api/` — FastAPI + PostgreSQL, sync protocol v1 |
| Local DB | Expo SQLite `northcare.db`, schema **v9** (migration **009**) |
| API Alembic | head **0006** (`community_requests` channel includes AT sandbox) |
| Stitch | project `749026157623860355` |
| Reach contracts | `implementation/reach-*.json`, `community-request-*.json`, `worker-profession-registry.json` |
| OpenAPI | `implementation/openapi.json` — **35** paths (includes AT USSD webhook) |
| USSD simulator | `services/api/static/reach-simulator/` → `GET /reach-simulator` |
| AT USSD webhook (sandbox) | `POST /v1/reach/ussd/africas-talking/{callbackSecret}` — gated by `NORTHCARE_REACH_AT_USSD_*` |
| Worker Community Requests | `/(worker)/community-requests`, `/(worker)/community-requests/[requestId]` |
| Demo CLIs | `python -m northcare_api.cli.reset_reach_demo`, `seed_reach_demo` |

### Reach R6 verification snapshot

See `docs/development/REACH_R6_CHECKPOINT.md`.

## Known blockers (honest)

- Previous NetInfo codegen failure resolved for baseline/short-path builds by correcting `ANDROID_HOME` to the SDK root and clean `expo prebuild` (NetInfo preserved; New Architecture remains on)
- TalkBack / physical Samsung clinical validation pending
- **0** `APPROVED_FOR_PILOT` clinical packs; Firebase production auth deferred; no remote push
- Docker Desktop absent on validation host — portable Postgres used
- Stage 19 paused (not abandoned)
- Physical Android Reach walkthrough pending
- Offline AI Stage 1 device evidence complete (see `docs/development/OFFLINE_AI_STAGE_1_CHECKPOINT.md`)
- Offline AI Stage 2 Ask NorthCare wiring tracked separately — do not regress chatbot UI when touching Stage 1 harness code

## Outstanding non-blocking items

- Clean frontline-worker onboarding photograph  
- Physical Samsung notification / reboot / battery validation  
- Physical QR / camera / microphone / nutrition / Ask NorthCare validation  
- Physical-device biometric / SecureStore / scrypt benchmarks  
- Reviewed Dagbanli translations / audio  
- Final SVG logo visual approval  
- Material Symbols icon font bundling  
- Firebase public config provisioning (future)  
- Database encryption evaluation (future pilot)  
- Successful `com.northcareai.app` development build install  
- Full TalkBack walkthrough on native package  
- Background sync (deferred)  
- Stage 19 E2E testing / demonstration / release prep (**paused**)  
- Pre-existing mobile lint react-hooks issue on `ClientRegisterScreen`  

## Development dual-role access

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Account ID | `dev-dual-8d2ce4bbb8e656c8afea` |
| Roles | worker + admin |
| Facility | `fac-dev-001` |
| Organisation | `org-dev-001` |
| Reach profession (R1 applied) | `communityHealthOfficer` |
| Community requests | enabled |
| Emergency requests | enabled |

Password is never printed in status docs. Use existing secure local provisioning only.

## Reach demo gate

```env
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_ENV=development
```

Default is disabled. Staging/production refuse enablement.

## Africa's Talking USSD sandbox gate (T1)

```env
NORTHCARE_ENV=development
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_REACH_AT_USSD_ENABLED=true
NORTHCARE_REACH_AT_USSD_MODE=sandbox
NORTHCARE_REACH_AT_USSD_CALLBACK_SECRET=<local-only-secret>
NORTHCARE_REACH_AT_USSD_SERVICE_CODES=<sandbox-service-code-from-AT>
```

Callback URL shape: `https://<public-host>/v1/reach/ussd/africas-talking/<CALLBACK_SECRET>`.  
Current hosted demo host: `https://northcare-api.onrender.com`. Tunnels are temporary backup. Default is disabled. `MODE=live` is rejected. Staging/production refuse enablement. See `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`.
