# NorthCare AI — Implementation Roadmap

**Status:** Planning complete — awaiting stage approval  
**Product:** NorthCare AI (*Smarter care. Stronger communities.*)  
**Platform:** Android-first · React Native · Expo · TypeScript  
**Stitch:** `749026157623860355` · https://stitch.withgoogle.com/projects/749026157623860355  
**Competition:** UNICEF StartUp Lab — AI for Nurturing Care Hackathon  
**Last updated:** 2026-08-02  

Related docs: `STAGE_DEPENDENCY_MAP.md` · `MVP_DELIVERY_PLAN.md` · `FEATURE_PRIORITY_MATRIX.md` · `DEFINITION_OF_DONE.md` · `TEST_STRATEGY.md` · `RISK_REGISTER.md` · `TECHNICAL_DECISIONS_REQUIRED.md` · `RELEASE_AND_DEMO_PLAN.md` · `CURSOR_IMPLEMENTATION_RULES.md`

---

## Repository audit snapshot (Stage 0 input)

### Present
| Material | Notes |
|---|---|
| `docs/PRODUCT_VISION.md` | Authoritative product intent |
| `docs/MVP_SCOPE.md` | Competition MVP journey |
| `docs/ARCHITECTURE.md` | Proposed stack (some values outdated vs Expo 57) |
| `docs/PROJECT_PRINCIPLES.md` | Safety / offline principles |
| `docs/USER_ROLES_AND_JOURNEYS.md` | Worker/admin journeys |
| `docs/COMPETITION_CONTEXT.md` | Hackathon framing |
| `docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md` | Open decisions |
| `docs/STITCH_DESIGN_OVERVIEW.md` | Design audit from exports |
| `stitch-exports/` | 45 downloaded folders + live API index (57 screens) |
| `northcare-app/` | Expo SDK **57** hello-world only |
| `.cursor/mcp.json` + Stitch MCP | Connected |
| `.env` (gitignored) | Stitch key — must never be committed |

### Missing / incomplete (vs earlier design-ingestion prompt)
Root `README.md`, `AGENTS.md`, `PROJECT_STATUS.md`, `assets/`, `design-reference/`, `implementation/*` manifests (except this roadmap JSON), many Phase-0 docs (`DESIGN_SYSTEM`, `ROUTE_MAP`, etc.).

### Contradictions to resolve
1. Brand primary: product `#0F766E` vs Stitch theme `primary: #005C55` / `primary_container: #0F766E`  
2. `ARCHITECTURE.md` cites Expo 51+; app is Expo 57  
3. Navigation: Expo Router vs React Navigation still open  
4. Live Stitch has ~57 screens; local export folders ~45  

**Authoritative for visuals:** Stitch project (MCP + exports).  
**Authoritative for safety/product rules:** `PROJECT_PRINCIPLES.md` + this roadmap.  
**Not authoritative as runtime:** Stitch HTML.

---

## Field legend (every stage)

Each stage includes: purpose, user value, competition value, priority, prerequisites, dependencies, included/excluded features, files, data models, API, local storage, offline/online, security, privacy, accessibility, Stitch screens, components, packages, package verification, tests, manual validation, acceptance, exit criteria, risks, fallbacks, docs updates, complexity.

Complexity: **Small | Medium | Large | Very large**

---

## STAGE 0 — Project Audit and Source of Truth

| Field | Content |
|---|---|
| **Purpose** | Confirm what exists; freeze sources of truth; list blockers before code changes |
| **User value** | Prevents wrong product/tech direction |
| **Competition value** | Judges need coherent, documented repo |
| **Priority** | P0 |
| **Prerequisites** | Workspace access; Stitch MCP/API |
| **Dependencies** | None |
| **Included** | Repo inventory; Stitch inventory; authority list; open-decision register; status note |
| **Excluded** | App features; package installs; screen coding |
| **Files** | `docs/*`, `stitch-exports/*`, `PROJECT_STATUS.md` (create), this roadmap set |
| **Data models** | None coded |
| **API** | Stitch MCP read-only |
| **Local storage** | N/A |
| **Offline/Online** | N/A |
| **Security** | Ensure `.env` ignored; no key logging |
| **Privacy** | No real patient data in exports/docs |
| **Accessibility** | Note Stitch 48dp / contrast rules for later |
| **Stitch screens** | Full project inventory |
| **Components** | Inventory only |
| **Packages** | None new |
| **Package verification** | N/A |
| **Tests** | Document review checklist |
| **Manual validation** | Compare docs vs Stitch vs `northcare-app` |
| **Acceptance** | Authority list + contradictions + decisions published |
| **Exit** | Team can approve S1 without guessing |
| **Risks** | Incomplete design ingestion mistaken for “ready to build everything” |
| **Fallbacks** | Use exports if MCP briefly unavailable |
| **Docs** | Roadmap docs + status |
| **Complexity** | Medium |

**S0 status:** Substantially advanced by this roadmap task; remaining design-ingestion files still optional/follow-up.

---

## STAGE 1 — Repository Foundation and Development Standards

| Field | Content |
|---|---|
| **Purpose** | Clean, reviewable repo standards before feature work |
| **User value** | Reliable delivery quality |
| **Competition value** | Inspectable GitHub submission |
| **Priority** | P0 |
| **Prerequisites** | S0 |
| **Dependencies** | S0 |
| **Included** | Folder structure; root README/AGENTS/PROJECT_STATUS; gitignore/secrets policy; lint/format/tsconfig policy; commit conventions; Cursor rules draft; Definition of Done link; branch strategy |
| **Excluded** | Feature screens; dependency installs beyond lint/format tooling if approved |
| **Files** | Root docs; `.gitignore`; `.cursor/rules` (after approval); `northcare-app` config only as needed |
| **Data models** | N/A |
| **API** | None |
| **Local storage** | Policy only (no patient data in AsyncStorage) |
| **Offline/Online** | Documented principle |
| **Security** | Secrets policy; no committed keys |
| **Privacy** | Synthetic-data policy in AGENTS |
| **Accessibility** | Baseline rules in AGENTS |
| **Stitch** | Reference only |
| **Components** | Structure placeholders only |
| **Packages** | ESLint/Prettier optional — **requires approval before install** |
| **Package verification** | Expo 57 compatibility if any tool added |
| **Tests** | Lint smoke; secret-ignore verification |
| **Manual** | Clone-fresh instructions make sense |
| **Acceptance** | AGENTS + README + secrets policy + DoD referenced |
| **Exit** | Ready for S2 hardening |
| **Risks** | Over-scoping monorepo |
| **Fallbacks** | Minimal README/AGENTS if tooling delayed |
| **Docs** | README, AGENTS, PROJECT_STATUS, Cursor rules doc |
| **Complexity** | Medium |

**Recommended first implementation stage.**

---

## STAGE 2 — Expo TypeScript Foundation and Android Environment

| Field | Content |
|---|---|
| **Purpose** | Runnable Android foundation from existing `northcare-app` |
| **User value** | App launches for workers/judges |
| **Competition value** | Proves real mobile app, not slides |
| **Priority** | P0 |
| **Prerequisites** | S1 |
| **Dependencies** | S1 |
| **Included** | Harden Expo 57 app; app identity; env pattern; error boundary; logging policy (no PII); emulator smoke; scripts; note Expo Go vs dev-build strategy |
| **Excluded** | Feature UI; backend |
| **Files** | `northcare-app/app.json`, `App.tsx`/`src` entry, `tsconfig`, scripts |
| **Data models** | None yet |
| **API** | None |
| **Local storage** | None yet |
| **Offline** | App must launch offline |
| **Online** | Metro bundler for dev |
| **Security** | No secrets in app config |
| **Privacy** | Logging scrubber stub |
| **A11y** | Root tree friendly |
| **Stitch** | Splash brand colours only if trivial |
| **Components** | App shell placeholder |
| **Packages** | Only if approved; verify Expo 57 |
| **Package verification** | Check docs.expo.dev v57 |
| **Tests** | Typecheck; manual emulator launch |
| **Manual** | Android Studio emulator opens app |
| **Acceptance** | Emulator smoke recorded |
| **Exit** | Green typecheck + launch |
| **Risks** | Windows/emulator setup friction |
| **Fallbacks** | Expo web **not** product path — Android only for acceptance |
| **Docs** | Setup section in README |
| **Complexity** | Medium |

Note: Expo project **already exists** — do not re-init unless D01 says so.

---

## STAGE 3 — Design System and Reusable Component Foundation

| Field | Content |
|---|---|
| **Purpose** | Translate Stitch/design tokens into RN primitives |
| **User value** | Consistent, calm field UI |
| **Competition value** | Professional trust |
| **Priority** | P0 |
| **Prerequisites** | S2; D05/D06 decisions preferred |
| **Dependencies** | S2 |
| **Included** | `theme.ts` tokens; Button; Text; Card; RiskCard; StatusChip; OfflineBanner; SyncIndicator; inputs; empty/loading/error primitives; logo component using **approved asset** |
| **Excluded** | Full screens; forging logo |
| **Files** | `northcare-app/src/constants/theme.ts`, `src/components/**`, `assets/brand/**` |
| **Data models** | N/A |
| **API** | None |
| **Local storage** | None |
| **Offline** | OfflineBanner states |
| **Online** | SyncIndicator online state |
| **Security** | N/A |
| **Privacy** | N/A |
| **A11y** | Labels + 48dp defaults |
| **Stitch** | Design tokens / health_worker_empowerment / component patterns |
| **Components** | Listed above |
| **Packages** | `react-native-svg` likely; fonts — verify Expo 57 |
| **Package verification** | Required before install |
| **Tests** | Token values; component smoke |
| **Manual** | Visual gallery screen (dev-only OK) |
| **Acceptance** | No new hardcoded brand hex; logo not forged |
| **Exit** | Components usable by S4 |
| **Risks** | Colour freeze unresolved |
| **Fallbacks** | Use product-approved palette with documented Stitch mapping |
| **Docs** | DESIGN_SYSTEM (create/update) |
| **Complexity** | Large |

---

## STAGE 4 — Navigation, Splash, Onboarding and Application Shell

| Field | Content |
|---|---|
| **Purpose** | High-level app structure and entry flows |
| **User value** | Workers can enter the product |
| **Competition value** | First-minute judge impression |
| **Priority** | P0 |
| **Prerequisites** | S3; D02 navigation decision |
| **Dependencies** | S2, S3 |
| **Included** | Root nav; splash; onboarding×3; workspace selection; worker tab shell (Home/Clients/Assistant/Referrals/More); placeholders; deep-link stubs; Android back behaviour; session-loading |
| **Excluded** | Full auth logic (S6); admin full (stub OK) |
| **Files** | `src/navigation/**`, `src/screens/onboarding/**`, app entry |
| **Data models** | Local flags: onboardingComplete (SecureStore later in S6) |
| **API** | None |
| **Local storage** | First-run flag (temp OK) |
| **Offline** | Entire entry path offline |
| **Online** | None required |
| **Security** | No clinical data pre-auth |
| **Privacy** | Splash/onboarding only |
| **A11y** | Focus order on slides |
| **Stitch** | splash_animated, onboarding_1–3, workspace_selection, worker_dashboard shell |
| **Components** | Logo, buttons, indicators |
| **Packages** | Navigation lib per D02 — verify |
| **Tests** | Nav smoke first-time vs returning stub |
| **Manual** | Walk entry flows |
| **Acceptance** | Tabs render; splash→onboarding→workspace |
| **Exit** | Shell ready for auth wiring |
| **Risks** | Nav library churn |
| **Fallbacks** | Simplified splash animation with architecture for final motion |
| **Docs** | ROUTE_MAP draft |
| **Complexity** | Large |

---

> **Ordering note (2026-08-02):** Delivery stages were reordered after roadmap drafting.  
> **Delivered Stage 5** = Authentication and Secure Local Access.  
> **Delivered Stage 6** = Domain Models, SQLite and Repository Layer (content formerly labelled Stage 5 below).  
> **Next Stage 7** = Client Management Vertical Slice.  
> The historical Stage 6 Auth section below is superseded by the delivered auth stage.

## STAGE 5 — Domain Models, Local Database and Repository Layer
*(historical label — now scheduled as delivery Stage 6)*

| Field | Content |
|---|---|
| **Purpose** | Offline-first data foundation |
| **User value** | Work survives without internet |
| **Competition value** | Core differentiator |
| **Priority** | P0 |
| **Prerequisites** | S2 |
| **Dependencies** | S2 (can draft parallel to S3; bind after) |
| **Included** | Entities: User, Facility, Client, Caregiver, Encounter, Screening, ScreeningAnswer, Measurement, RiskAssessment, Referral, ReferralEvent, NutritionAssessment, Notification, SyncQueueItem, Attachment, KnowledgeArticle, LanguageAsset, AuditEvent; migrations; repositories; UUIDs; soft delete; sync status; seed synthetic data |
| **Excluded** | UI screens (except optional debug); cloud sync protocol |
| **Files** | `src/services/database/**`, `src/domain/**`, `src/repositories/**` |
| **Data models** | All above |
| **API** | None (local only) |
| **Local storage** | Expo SQLite; FileSystem for attachments later |
| **Offline** | DB is source of truth |
| **Online** | Queue fields prepared |
| **Security** | No secrets in DB; plan encryption later |
| **Privacy** | Synthetic seed only; no PII logs |
| **A11y** | N/A |
| **Stitch** | Data implied by client/referral/sync screens |
| **Components** | None required |
| **Packages** | `expo-sqlite` — verify SDK 57 |
| **Tests** | Migrations; CRUD; seed |
| **Manual** | Fresh install migrates |
| **Acceptance** | UI must not import SQLite directly (lint/convention) |
| **Exit** | Repositories ready for S6–S10 |
| **Risks** | Schema churn |
| **Fallbacks** | Minimal tables first: clients, encounters, screenings, referrals, sync_queue |
| **Docs** | Schema section update |
| **Complexity** | Very large |

---

## STAGE 6 — Authentication, Local Session and Secure Access

| Field | Content |
|---|---|
| **Purpose** | Secure worker access including offline unlock |
| **User value** | Safe daily start without internet |
| **Competition value** | Offline PIN demo moment |
| **Priority** | P0 |
| **Prerequisites** | S4, S5 |
| **Dependencies** | S4, S5 |
| **Included** | Worker login; PIN create/confirm; SecureStore verifier; returning PIN unlock; logout; session timeout stub; role route guards; privacy consent (simplified OK); inactive account state |
| **Excluded** | Full password recovery (P2); full biometrics (optional P2); real Firebase unless D08 approved |
| **Files** | `src/screens/auth/**`, `src/hooks/usePINAuth.ts`, SecureStore helpers |
| **Data models** | User, session flags |
| **API** | Optional mock auth |
| **Local storage** | SecureStore for PIN verifier/tokens; never patient charts there |
| **Offline** | Returning unlock fully offline |
| **Online** | First verification may require online later — document restriction |
| **Security** | Hash/derive PIN; no plaintext PIN |
| **Privacy** | No client data before auth |
| **A11y** | PIN keypad labels |
| **Stitch** | worker_login, create_pin, pin_unlock, privacy_consent |
| **Components** | PINKeypad |
| **Packages** | `expo-secure-store` — verify |
| **Tests** | PIN unit; guard tests; offline manual |
| **Manual** | Airplane mode unlock |
| **Acceptance** | Pre-auth screens show no clinical lists |
| **Exit** | Worker can reach shell authenticated |
| **Risks** | Demo auth too weak vs too heavy |
| **Fallbacks** | Demo credentials in seed docs (not production) |
| **Docs** | Security notes |
| **Complexity** | Large |

---

## STAGE 7 — Client Management Vertical Slice

| Field | Content |
|---|---|
| **Purpose** | Complete offline client workflow |
| **User value** | Register and find mothers/children |
| **Competition value** | Essential journey step |
| **Priority** | P0 |
| **Prerequisites** | S6 |
| **Dependencies** | S5, S6 |
| **Status** | **COMPLETE** (2026-08-02) — awaiting Stage 8 approval |
| **Included** | List, search, filters, empty state, category select, multi-step registration for categories, caregiver/location, consent, local transactional save, profile, sanitised history, archive confirm, explainable duplicate warning |
| **Excluded** | Growth charts (P2); visits/screenings |
| **Files** | `apps/mobile/src/features/clients/**`, `apps/mobile/app/(worker)/clients/**` |
| **Data models** | Client, Caregiver, ClientRelationship (+ schema v2 consent/age unit) |
| **API** | None |
| **Local storage** | SQLite via repos + use cases |
| **Offline** | Full slice offline |
| **Online** | Queue client upserts only (no networking) |
| **Security** | Auth required; admin denied worker client routes |
| **Privacy** | Soft delete; minimise displayed identifiers; UUID routes |
| **A11y** | List/item labels, step progress text, form errors |
| **Stitch** | client_directory, register_client_type, client_profile — UX reference only |
| **Components** | ClientListItem, PrivacyAvatar, StepProgress |
| **Packages** | None new |
| **Tests** | Use-case/list/search/register/duplicates/edit/archive/rollback/security |
| **Manual** | Android walkthrough pending (emulator offline) |
| **Acceptance** | Automated gates pass; Android documented pending |
| **Exit** | Ready for visits (Stage 8 approval required) |
| **Risks** | Registration scope creep |
| **Fallbacks** | Seed clients + thin registration |
| **Docs** | Client architecture / consent / duplicates / drafts |
| **Complexity** | Large |

---

## STAGE 8 — Visits and Guided Screening

| Field | Content |
|---|---|
| **Status** | **COMPLETE** (2026-08-02) — awaiting Stage 9 approval |
| **Purpose** | Structured assessments with drafts |
| **User value** | Complete visits without paper |
| **Competition value** | Clinical utility proof |
| **Priority** | P0 |
| **Prerequisites** | S7 |
| **Dependencies** | S7 |
| **Included** | Start visit; synthetic guided form (clearly labelled); measurements; draft save/resume; review answers; completion; template governance |
| **Excluded** | Medical priority/danger-sign engine (S9); unsafe unverified medical content; all five clinical packs |
| **Files** | `apps/mobile/src/features/visits/**`, `apps/mobile/src/features/screening/**`, Expo Router visit routes |
| **Data models** | Encounter, Screening, ScreeningAnswer, Measurement |
| **API** | None |
| **Local storage** | SQLite |
| **Offline** | Full |
| **Online** | Queue enqueue only (no network sync) |
| **Security** | Auth-protected worker routes; UUID path params |
| **Privacy** | No logs of answers |
| **A11y** | Form controls; Section X of Y progress text |
| **Stitch** | start_new_visit; forms largely **missing** — built from IA + tokens |
| **Components** | QuestionField + existing design-system inputs |
| **Packages** | None |
| **Tests** | Engine; draft resume; completion rollback; security |
| **Manual** | Emulator offline — see ANDROID_SCREENING_VALIDATION.md |
| **Acceptance** | Saved encounter + answers offline |
| **Exit** | Ready for S9 approval |
| **Risks** | Content not clinically approved — documented gap |
| **Fallbacks** | Label synthetic questionnaire clearly |
| **Docs** | Screening content provenance + versioning |
| **Complexity** | Large |

---

## STAGE 9 — Deterministic Risk Engine and Explainable Results

| Field | Content |
|---|---|
| **Status** | COMPLETE (2026-08-02) — awaiting Stage 10 approval |
| **Purpose** | Safe, testable Red/Amber/Green prioritisation |
| **User value** | Clear next action |
| **Competition value** | Responsible AI differentiator |
| **Priority** | P0 |
| **Prerequisites** | S8; D12 rules decision |
| **Dependencies** | S8 |
| **Included** | Rule representation/versioning; RAG priorities; missing-data behaviour; explanations; contributing factors; recommended actions; human confirm; audit metadata; extensive unit tests |
| **Excluded** | LLM risk scoring; diagnosis language |
| **Files** | `src/services/risk/**`, screening result screen |
| **Data models** | RiskAssessment |
| **API** | None |
| **Local storage** | Persist assessment |
| **Offline** | Full |
| **Online** | None |
| **Security** | Rules immutable at runtime without version bump |
| **Privacy** | Explanations without leaking to notifications |
| **A11y** | Risk colour + text |
| **Stitch** | screening_result |
| **Components** | RiskCard, explainer |
| **Packages** | None |
| **Tests** | **Mandatory** golden fixtures |
| **Manual** | Trigger red via seed answers |
| **Acceptance** | No diagnose/prescribe copy; explanations show rule IDs/codes |
| **Exit** | Engine trusted for demo |
| **Risks** | Unapproved clinical rules |
| **Fallbacks** | “Demonstration ruleset vX” banner |
| **Docs** | Rules provenance |
| **Complexity** | Large |

---

## STAGE 10 — Referral Management and QR Referral Passport

| Field | Content |
|---|---|
| **Status** | COMPLETE (2026-08-02) |
| **Purpose** | Urgent-case continuity offline |
| **User value** | Track referrals to facility |
| **Competition value** | Last-mile referral story |
| **Priority** | P0 |
| **Prerequisites** | S9 |
| **Dependencies** | S9 |
| **Included** | Create referral; facility select; urgency/reason/transport; caregiver informed; local save; timeline events; overdue flag; QR generate; privacy-minimised payload |
| **Excluded** | Facility QR scanning (P2); multi-facility live coordination |
| **Files** | referral screens; QR component; referral repo |
| **Data models** | Referral, ReferralEvent |
| **API** | None required |
| **Local storage** | SQLite; QR render offline |
| **Offline** | Create + QR + timeline local |
| **Online** | Queue referral |
| **Security** | Minimal QR data |
| **Privacy** | No excess clinical detail in QR |
| **A11y** | Timeline labels |
| **Stitch** | referral_passport; create flow may need new UI |
| **Components** | ReferralTimeline, QR |
| **Packages** | QR lib — spike + verify |
| **Tests** | State machine; QR payload constraints |
| **Manual** | Airplane mode create + show QR |
| **Acceptance** | Referral persists offline |
| **Exit** | P0 clinical path nearly complete |
| **Risks** | QR lib issues |
| **Fallbacks** | Display passport text + deep link string if QR lib fails |
| **Docs** | Referral status model |
| **Complexity** | Large |

---

## STAGE 11 — Voice-to-Care Capture and Extraction Review

| Field | Content |
|---|---|
| **Status** | **COMPLETE** (2026-08-02) — awaiting Stage 12 approval |
| **Purpose** | Voice capture with mandatory human review |
| **User value** | Faster field documentation |
| **Competition value** | Signature AI feature |
| **Priority** | P0 |
| **Prerequisites** | S8; review UI before real AI |
| **Dependencies** | S8 (S9 preferred before treating extraction as clinical) |
| **Included** | Mic permission; record/pause/stop/cancel; playback; consent foundation; provider architecture; dev simulation; manual transcript; extraction review; apply boundaries; retention |
| **Excluded** | Production STT/LLM (0 approved providers); expo-av; background recording; audio SQLite blobs |
| **Files** | `apps/mobile/src/features/voice/`; migration 005 |
| **Data models** | voice_capture_sessions, voice_transcripts, voice_extraction_runs, voice_extraction_suggestions |
| **API** | Optional later |
| **Local storage** | expo-audio + expo-file-system app-private files |
| **Offline** | Recording + manual path offline; production ASR/extraction fail closed |
| **Online** | Optional cloud STT later when approved |
| **Security** | Random filenames; no encryption claims; see LOCAL_AUDIO_SECURITY_LIMITATIONS.md |
| **Privacy** | Consent ≠ mic permission; decline blocks mic |
| **A11y** | Mic button states; review actions labelled |
| **Stitch** | voice_capture; extraction review built (missing from finals) |
| **Components** | VoiceWaveform, voice screens |
| **Packages** | `expo-audio@~57.0.3`, `expo-file-system@~57.0.1` — Expo Go compatible for capture |
| **Tests** | Voice suite pass; full suite pending reconfirm |
| **Manual** | Physical Samsung mic validation pending; emulator offline |
| **Acceptance** | Confirmed extraction only writes official fields |
| **Exit** | Real recording + fail-closed production providers + dev simulation honesty |
| **Risks** | Mic/emulator failures |
| **Fallbacks** | Manual transcript; guided screening |
| **Docs** | VOICE_TO_CARE_ARCHITECTURE.md, VOICE_AUDIO_TECHNOLOGY_DECISION.md, STAGE_11_CHECKPOINT.md |
| **Complexity** | Very large |

---

## STAGE 12 — Nutrition Assessment and Local Guidance

| Field | Content |
|---|---|
| **Purpose** | Localised nutrition workflow |
| **User value** | Practical caregiver support |
| **Competition value** | Nutrition challenge area |
| **Priority** | P0 (lite) |
| **Prerequisites** | S7, S8 |
| **Dependencies** | S7, S8 |
| **Included** | Feeding basics; local foods; diversity ring; meal suggestions UI; follow-up schedule; EN + Dagbanli-ready UI; audio controls stub |
| **Excluded** | Fabricated final medical nutrition claims; full audio library |
| **Files** | nutrition screens; content JSON marked reviewed/placeholder |
| **Data models** | NutritionAssessment |
| **API** | None |
| **Local storage** | SQLite + content bundles |
| **Offline** | Full for bundled content |
| **Online** | Content updates later |
| **Security** | N/A |
| **Privacy** | Non-shaming copy |
| **A11y** | Ring chart description |
| **Stitch** | nutrition_planner |
| **Components** | NutritionRing, FoodSelector |
| **Packages** | svg already |
| **Tests** | Diversity calc; content flags |
| **Manual** | Offline guidance visible |
| **Acceptance** | Placeholder vs reviewed clearly labelled |
| **Exit** | Demo nutrition step ready |
| **Risks** | Unreviewed content treated as clinical truth |
| **Fallbacks** | Short approved static tips only |
| **Docs** | Content provenance |
| **Complexity** | Large |

---

## STAGE 13 — Ask NorthCare Constrained Assistant

| Field | Content |
|---|---|
| **Purpose** | Safe Q&A over approved content |
| **User value** | Quick guidance |
| **Competition value** | P1 depth |
| **Priority** | P1 |
| **Prerequisites** | S3, S5, approved content inventory |
| **Dependencies** | S3, S5 |
| **Included** | Assistant home; suggestions; text chat; sources; Lite Answers; emergency override card; unsupported handling; safety notice |
| **Excluded** | Diagnose/prescribe; unconstrained LLM; dosage |
| **Files** | assistant screens; knowledge retrieval |
| **Data models** | KnowledgeArticle |
| **API** | Optional later |
| **Local storage** | Bundled answers |
| **Offline** | Lite Answers |
| **Online** | Enhanced optional |
| **Security** | Constrained prompts |
| **Privacy** | No client PHI in prompts by default |
| **A11y** | Chat semantics |
| **Stitch** | ask_northcare_assistant |
| **Components** | Chips, citation cards |
| **Packages** | TBD — approve first |
| **Tests** | Emergency override; refusal cases |
| **Manual** | Ask unsafe question → refuse |
| **Acceptance** | Safety hierarchy enforced |
| **Exit** | Assistant usable offline for curated set |
| **Risks** | Hallucination |
| **Fallbacks** | Retrieval-only FAQ |
| **Docs** | Assistant policy |
| **Complexity** | Large |

---

## STAGE 14 — Backend, Synchronisation and Conflict Handling

| Field | Content |
|---|---|
| **Purpose** | Shared services + sync without blocking local work |
| **User value** | Continuity across devices/facilities |
| **Competition value** | Sync story (P0 proof; P1 production) |
| **Priority** | P0 proof / P1 full backend |
| **Prerequisites** | S5–S10 |
| **Dependencies** | S5, S6, S7, S8, S9, S10 |
| **Included** | Sync queue worker; Sync Centre UI; status machine; retry; last sync; **either** mock sync **or** FastAPI+auth per D09/D10; conflict strategy; idempotency; audit log basics |
| **Excluded** | Perfect multi-region HA |
| **Files** | `backend/` (if approved), `src/services/sync/**`, sync_centre screen |
| **Data models** | SyncQueueItem + version fields |
| **API** | FastAPI if approved |
| **Local storage** | Queue persists offline |
| **Offline** | Local writes always succeed |
| **Online** | Push/pull when connected |
| **Security** | AuthZ; TLS; validation |
| **Privacy** | Minimum necessary sync payload |
| **A11y** | Sync Centre statuses |
| **Stitch** | sync_centre, system_states_conflicts |
| **Components** | SyncIndicator |
| **Packages** | Backend stack TBD — approve |
| **Tests** | Idempotency; conflict unit; manual sync |
| **Manual** | Airplane → create → online → synced |
| **Acceptance** | Core flows never wait on network |
| **Exit** | Demo sync path credible |
| **Risks** | Backend time sink |
| **Fallbacks** | High-quality mock sync with clear labelling |
| **Docs** | Sync protocol |
| **Complexity** | Very large |

---

## STAGE 15 — Notifications and Follow-up Scheduling

| Field | Content |
|---|---|
| **Purpose** | Privacy-safe reminders |
| **User value** | Don’t miss follow-ups |
| **Competition value** | Completes journey step 17 |
| **Priority** | P0 local / P1 push |
| **Prerequisites** | S5, S7, S10; S14 for push |
| **Dependencies** | S5, S7, S10, (S14 for push) |
| **Included** | In-app centre; local notifications; types: follow-up, overdue referral, sync, storage; read/unread; deep links; lock-screen-safe copy; permission denied |
| **Excluded** | Rich clinical lock-screen text |
| **Files** | notification screens/services |
| **Data models** | Notification |
| **API** | Push provider later |
| **Local storage** | SQLite + OS scheduler |
| **Offline** | Local schedule works |
| **Online** | Push optional |
| **Security** | Auth for in-app |
| **Privacy** | Lock-screen minimisation |
| **A11y** | Notification list |
| **Stitch** | notification_centre; detail/settings missing |
| **Components** | FilterChips |
| **Packages** | `expo-notifications` — verify |
| **Tests** | Privacy copy unit; deep link |
| **Manual** | Trigger overdue referral alert |
| **Acceptance** | No diagnosis details on lock screen |
| **Exit** | Demo notification visible |
| **Risks** | Permission denial |
| **Fallbacks** | In-app only |
| **Docs** | Notification architecture |
| **Complexity** | Large |

---

## STAGE 16 — Administrator Workspace

| Field | Content |
|---|---|
| **Purpose** | System management |
| **User value** | Supervisors oversee workers/referrals |
| **Competition value** | P1 |
| **Priority** | P1 |
| **Prerequisites** | S6, S14 |
| **Dependencies** | S6, S14 |
| **Included** | Admin dashboard; worker list CRUD-lite; activate/deactivate; facility assign; referral overview; sync health; content stub; aggregated stats |
| **Excluded** | Unrestricted patient chart access |
| **Files** | `src/screens/admin/**` |
| **Data models** | User, Facility, AuditEvent |
| **API** | Requires online for org-wide |
| **Local storage** | Cached aggregates optional |
| **Offline** | Limited; show honest offline limits |
| **Online** | Primary |
| **Security** | RBAC |
| **Privacy** | Aggregate-first |
| **A11y** | Tables/lists |
| **Stitch** | admin_dashboard, worker_management |
| **Components** | KPI cards |
| **Packages** | None specific |
| **Tests** | RBAC denials |
| **Manual** | Admin cannot open full patient chart |
| **Acceptance** | Role separation works |
| **Exit** | Optional for demo APK |
| **Risks** | Scope creep |
| **Fallbacks** | Hide admin in demo build |
| **Docs** | Admin boundaries |
| **Complexity** | Large |

---

## STAGE 17 — Full Stitch Visual Integration and Motion Refinement

| Field | Content |
|---|---|
| **Purpose** | Visual fidelity for working workflows |
| **User value** | Clarity under field conditions |
| **Competition value** | Polish without faking function |
| **Priority** | P0 (demo screens) |
| **Prerequisites** | Working P0 workflows |
| **Dependencies** | S10–S16 (as completed) |
| **Included** | Screen-by-screen Stitch compare for demo path; AUTH/WORKSPACE/NOTIF UX backlog; motion for splash/workspace; reduced-motion |
| **Excluded** | Effects that hurt performance; screenshot UIs; clinical/sync rule changes |
| **Files** | Screen styles; design-system; motion tokens; notification icon |
| **Data models** | N/A |
| **API** | N/A |
| **Local storage** | N/A |
| **Offline** | Preserve indicators |
| **Online** | N/A |
| **Security** | Password visibility UX only (no secret logging) |
| **Privacy** | Preserve reminder privacy wording |
| **A11y** | Reduced motion (full a11y → Stage 18) |
| **Stitch** | All demo screens mapped |
| **Components** | Refine existing + PasswordField / EntranceMotion |
| **Packages** | None (RN Animated only) |
| **Tests** | Design-system, password visibility, motion, state-accuracy |
| **Manual** | Side-by-side Stitch + Android Expo Go 57 |
| **Acceptance** | Demo path looks intentional and calm; backlog UX items closed |
| **Exit** | Ready for hardening |
| **Risks** | Polish delaying bugs |
| **Fallbacks** | Token-correct simple UI |
| **Docs** | STAGE_17_* design/checkpoint docs |
| **Complexity** | Large |
| **Status (2026-08-02)** | **COMPLETE** |

---

## STAGE 18 — Accessibility, Security, Privacy and Quality Hardening

| Field | Content |
|---|---|
| **Status (2026-08-02)** | **COMPLETE — awaiting Stage 19 approval** |
| **Purpose** | Serious demo + future pilot readiness |
| **User value** | Safer, more usable |
| **Competition value** | Trust + responsibility |
| **Priority** | P0 |
| **Prerequisites** | S17 (or parallel focused on P0 path) |
| **Dependencies** | Feature-complete demo path |
| **Included** | A11y pass; SecureStore review; log scrub; dependency audit; permissions; session; notification privacy; migration tests; offline stress; conflict tests; crash boundaries |
| **Excluded** | Full formal compliance certification |
| **Files** | Cross-cutting |
| **Data models** | Audit fixes |
| **API** | Hardening |
| **Local storage** | Review |
| **Offline** | Stress |
| **Online** | Sync stress |
| **Security** | Secret scan |
| **Privacy** | End-to-end review |
| **A11y** | Full checklist |
| **Stitch** | Contrast/touch compliance |
| **Components** | Fixes |
| **Packages** | Audit only |
| **Tests** | Security + offline suites |
| **Manual** | TalkBack sample; airplane stress |
| **Acceptance** | Secret scan clean; DoD met |
| **Exit** | Freeze candidate |
| **Risks** | Late discoveries |
| **Fallbacks** | Document residual risks |
| **Docs** | Hardening report |
| **Complexity** | Large |

---

## STAGE 19 — Testing, Demonstration and Release Preparation

| Field | Content |
|---|---|
| **Purpose** | Competition-ready artefact |
| **User value** | Reliable demo |
| **Competition value** | Submission quality |
| **Priority** | P0 |
| **Prerequisites** | S18 |
| **Dependencies** | All P0 stages |
| **Included** | Test matrix execution; emulator + device; demo data/reset; primary+backup scripts; README; architecture summary; screenshots; GitHub review; licence; tag `demo-freeze` |
| **Excluded** | Post-hackathon pilots |
| **Files** | README, scripts/demo*, release notes |
| **Data models** | Seed packs |
| **API** | Documented |
| **Local storage** | Reset tool |
| **Offline/Online** | Rehearsed |
| **Security** | Final secret scan |
| **Privacy** | Screenshot review |
| **A11y** | Spot check |
| **Stitch** | Final compare |
| **Components** | Freeze |
| **Packages** | Freeze |
| **Tests** | Full P0 automated + manual demo E2E |
| **Manual** | Full judge script timed |
| **Acceptance** | P0 journey reproducible by second person |
| **Exit** | Submission package ready |
| **Risks** | Last-minute breakage |
| **Fallbacks** | Guided-only demo build |
| **Docs** | RELEASE notes |
| **Complexity** | Large |

---

## Git and change-safety strategy

| Topic | Proposal (for approval) |
|---|---|
| Main branch | `main` — always runnable demo-safe |
| Development | `develop` or stage branches `stage/N-short-name` |
| Commits | Conventional: `feat(stageN):`, `fix(stageN):`, `docs:`, `chore:` |
| Checkpoints | Commit + optional tag after each approved stage |
| PRs | One stage per PR when possible |
| Rollback | Revert stage PR; restore DB via migration down or reinstall+seed |
| Env files | `.env` gitignored; `.env.example` without secrets |
| Secret scanning | Before every push to shared remote |
| Backups | Before migrations on device/emulator |

---

## First coding stage recommendation

**Start with Stage 1 — Repository Foundation and Development Standards.**

Why not Stage 2 first? `northcare-app` already exists, but root standards (`AGENTS.md`, secrets policy, README, Cursor rules approval) are missing. Stage 1 unblocks safe Stage 2 hardening.

### Draft Stage 1 implementation prompt scope

**Permitted to change/create:**
- Root `README.md`, `AGENTS.md`, `PROJECT_STATUS.md`
- `.gitignore` (keep `.env` ignored)
- Docs cross-links / status
- `.cursor/rules/northcare-project.mdc` **only if approved**
- Minimal folder scaffolds: `assets/`, `design-reference/` (empty OK with README)

**Forbidden:**
- Feature screens
- Package installs unless explicitly approved in the prompt
- Recreating Expo app
- Touching Stitch designs via generative edits

**Expected commands:** file writes; `git status` if committing requested  
**Deliverables:** standards docs + status  
**Tests:** verify `.env` not tracked; docs present  
**Completion:** checkpoint report + stop  

---

## Checkpoint rule

After every stage: complete `IMPLEMENTATION_CHECKPOINT_TEMPLATE.md` and **stop for approval**.
