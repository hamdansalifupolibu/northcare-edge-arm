# NorthCare AI — Implementation Handoff

**Audience:** New Cursor / coding-agent chats  
**Last updated:** 2026-08-03  
**Canonical status file:** [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) (root)

Use this file to bootstrap without rereading chat history. Do **not** invent completed work. Prefer this + `PROJECT_STATUS.md` + the current stage spec over prior conversations.

---

## Read first (in order)

1. [`AGENTS.md`](../../AGENTS.md) — permanent product, stage, safety, and privacy rules  
2. [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) — current stage and milestones  
3. **This file** — bootstrap facts, run commands, blockers, next stage  
4. Current stage file: [`stages/REACH_R6_INTEGRATION_AND_DEMO.md`](stages/REACH_R6_INTEGRATION_AND_DEMO.md) (R6 complete — ready for manual validation)  
5. Latest Reach checkpoint: [`REACH_R6_CHECKPOINT.md`](REACH_R6_CHECKPOINT.md)  
6. Prior Reach: [`REACH_R5_CHECKPOINT.md`](REACH_R5_CHECKPOINT.md), [`REACH_R4_CHECKPOINT.md`](REACH_R4_CHECKPOINT.md), [`REACH_R3_CHECKPOINT.md`](REACH_R3_CHECKPOINT.md), [`REACH_R2_CHECKPOINT.md`](REACH_R2_CHECKPOINT.md), [`REACH_R1_CHECKPOINT.md`](REACH_R1_CHECKPOINT.md), [`REACH_R0_CHECKPOINT.md`](REACH_R0_CHECKPOINT.md)  
7. Core Stage 18 checkpoint: [`STAGE_18_CHECKPOINT.md`](STAGE_18_CHECKPOINT.md)

Also useful: [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md), [`LOCAL_BACKEND_STACK.md`](LOCAL_BACKEND_STACK.md), [`DEVELOPMENT_DUAL_ROLE_ACCESS.md`](DEVELOPMENT_DUAL_ROLE_ACCESS.md), [`NORTHCARE_REACH_DEMO_ACCOUNT.md`](NORTHCARE_REACH_DEMO_ACCOUNT.md).

---

## Product identity (do not drift)

| Item | Value |
|---|---|
| Name | **NorthCare AI** (exact spelling) |
| Tagline | Smarter care. Stronger communities. |
| Platform | Android-first **React Native + Expo + TypeScript** |
| Not | A website / Next.js / React web product |
| Context | Northern Ghana; authorised frontline health workers |
| Stitch project | `749026157623860355` |

Hard rules: no diagnose / prescribe / dosage; no AI save without worker confirmation; no LLM as primary danger-sign engine; synthetic data only; never commit or print secrets.

---

## Where we are

| Item | Status |
|---|---|
| Completed | **Stages 1–18** (Stage 14 validated; Stage 18 complete) |
| Extension | **NorthCare Reach R0–R6** packaged (R6 integration / demo preparation) |
| Current | Reach R6 checkpoint ready; **awaiting manual validation** |
| Next | Manual Reach validation, then human decision on **Stage 19** resume |
| Stage 19 | **PAUSED** until Reach R6 manual validation approval |
| Production ready | **Not claimed** |

Honest stage sequence completed:

1 Foundation/docs → 2 Expo Android → 3 Design system → 4 Nav/onboarding → 5 Auth/PIN → 6 SQLite/repos → 7 Clients → 8 Visits/screening → 9 Risk engine → 10 Referrals/QR → 11 Voice → 12 Nutrition → 13 Ask NorthCare → 14 Backend sync → 14 validated → 15 Reminders → 16 Admin + multi-role → 17 UI/UX → 18 A11y/security → Stage 19 paused → Reach R0 → R1 → R2 → R3 → R4 → R5 → **Reach R6 demo packaging**

---

## Key paths

| Concern | Path |
|---|---|
| Mobile app (Expo SDK ~57) | `apps/mobile/` |
| Design system / theme | `apps/mobile/src/design-system/`, `apps/mobile/src/theme/` |
| Features | `apps/mobile/src/features/{auth,clients,visits,screening,risk,referrals,voice,nutrition,assistant,sync,reminders,administration}/` |
| Local data / repos | `apps/mobile/src/data/` — UI must **not** touch SQLite directly |
| Routes (Expo Router) | `apps/mobile/app/` |
| Sync + admin API | `services/api/` (FastAPI + PostgreSQL + Alembic) |
| Roadmap (machine-readable) | `implementation/implementation-roadmap.json` |
| Stage checkpoints | `docs/development/STAGE_*_CHECKPOINT.md`, `REACH_*_CHECKPOINT.md` |
| Security / a11y evidence | `docs/security/`, `docs/accessibility/` |
| Canonical logo (interim) | `assets/brand/logos/northcare-logo-symbol-primary.png` |

### Schema versions (as of Reach R6)

- Mobile SQLite: **v9** (migration 009), DB name `northcare.db` — **no** Reach mobile request repository  
- API Alembic head: **0005** (`community_requests`)  
- Sync protocol: **v1**  
- Reach: R0–R5 implemented; R6 demo reset/seed CLIs + packaging docs/tests  

---

## Quality gates (Reach R1)

| Check | Result |
|---|---|
| Mobile tests | **377** passed / 86 suites |
| API tests | **110** passed |
| Expo Doctor | **20/20** |
| Mobile typecheck | Pass |
| Mobile lint | Pre-existing `ClientRegisterScreen` react-hooks error (not R1) |
| Backend ruff / mypy | Pass |
| Packages installed (R1) | **None** |
| WCAG / OWASP / production certification | **Not claimed** |

### Reach R0 artifact validation

```bash
python scripts/validate_reach_r0_artifacts.py
```

---

## How to run

### Mobile

From repository root:

```bash
npm run mobile:start
npm run mobile:android
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test
npm run mobile:doctor
```

Working directory for direct Expo commands: `apps/mobile/`.  
Expo docs for this SDK: https://docs.expo.dev/versions/v57.0.0/

### API (validated path without Docker Desktop)

See [`BACKEND_LOCAL_SETUP.md`](BACKEND_LOCAL_SETUP.md) and [`LOCAL_BACKEND_STACK.md`](LOCAL_BACKEND_STACK.md).

Summary:

1. Start portable PostgreSQL 16.x on `127.0.0.1:5432` (Docker Desktop was absent on the validation host).  
2. From `services/api`: venv → install → `alembic upgrade head` → `scripts/seed_dev.py` → uvicorn on `127.0.0.1:8000`.  
3. Compose artifacts exist but Docker runtime was **not** validated on that host.

### Development dual-role account

| Field | Value |
|---|---|
| Email | `hamdansalifupolibu@gmail.com` |
| Account ID | `dev-dual-8d2ce4bbb8e656c8afea` |
| Roles | `worker` + `admin` |
| Facility | `fac-dev-001` |
| Profession (R1) | `communityHealthOfficer` (both Reach flags enabled) |

**Never** store, print, or commit the password or Argon2 verifier. Provision via CLI only — see [`DEVELOPMENT_DUAL_ROLE_ACCESS.md`](DEVELOPMENT_DUAL_ROLE_ACCESS.md). Profile CLI: `python -m northcare_api.cli.set_development_professional_profile` (dev only).

---

## Honest blockers / limitations

- Android `expo run:android` / native install blocked by **Windows path length (>260)** under the deep OneDrive checkout; `ANDROID_HOME` has also been mis-set. Details: [`ANDROID_DEVELOPMENT_BUILD.md`](ANDROID_DEVELOPMENT_BUILD.md).  
- Expo Go SDK 57 is the partial validation path; native notifications / camera / audio / SecureStore need a short-path or symlink development build.  
- Full **TalkBack** and physical **Samsung** validation still pending.  
- **0** `APPROVED_FOR_PILOT` clinical knowledge packs (Ask NorthCare production fails closed; synthetic development pack only).  
- Firebase production auth deferred; no remote push.  
- Docker Desktop absent on validation host — portable Postgres used instead.  
- Background sync remains disabled.  
- Stage 19 (E2E, demo, release prep) **paused**.  
- Reach R2+ (Community Requests backend / USSD / worker centre) **not started**.  
- Mobile lint still reports a pre-existing `ClientRegisterScreen` react-hooks issue unrelated to R1.

---

## What a new agent should / should not do

**Do**

- Implement **only** an approved stage; stop and checkpoint when done.  
- Keep the repo runnable; update tests/docs with the stage.  
- Use repositories for data access; preserve offline-first clinical writes.  
- Report files changed; await human approval before the next stage.

**Do not**

- Start Stage 19 without explicit approval after Reach manual validation.  
- Build a website as the NorthCare AI product (Reach simulator is a labelled static USSD mock on FastAPI — not a second product app).  
- Commit `.env`, secrets, passwords, tokens, or verifiers.  
- Log health data, PINs, tokens, contact numbers, or full QR payloads.  
- Forge logos or invent medical / Dagbanli clinical content.

---

## Next stage (await approval)

**Manual validation of Reach R6**, then a human decision on resuming **STAGE 19**.

Do not start Stage 19 automatically.

Demo runbook: [`NORTHCARE_REACH_DEMO_RUNBOOK.md`](NORTHCARE_REACH_DEMO_RUNBOOK.md).  
Reach MVP: [`../product/NORTHCARE_REACH_MVP.md`](../product/NORTHCARE_REACH_MVP.md).  
R6 checkpoint: [`REACH_R6_CHECKPOINT.md`](REACH_R6_CHECKPOINT.md).  
Checkpoint template: [`IMPLEMENTATION_CHECKPOINT_TEMPLATE.md`](IMPLEMENTATION_CHECKPOINT_TEMPLATE.md).
