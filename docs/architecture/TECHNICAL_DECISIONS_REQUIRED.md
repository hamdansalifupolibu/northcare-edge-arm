# Technical Decisions Required

These decisions must be explicitly approved. Until approved, treat them as **assumptions**, not confirmed facts.

| ID | Decision | Options | Needed before | Recommendation (non-binding) | Status |
|---|---|---|---|---|---|
| D01 | App package location | Continue `northcare-app/` vs recreate | S1 | Continue existing Expo 57 app; harden in place | Open |
| D02 | Navigation | Expo Router vs React Navigation | S4 | Expo Router (file routes) **or** React Navigation per Stitch handoff — pick one and freeze | Open |
| D03 | State management | Context / Zustand / Redux Toolkit | S4–S5 | Zustand or Context first; avoid Redux unless needed | Open |
| D04 | UI kit | React Native Paper vs custom tokens-only | S3 | Tokens-first + small custom primitives; Paper optional | Open |
| D05 | Primary brand teal | `#0F766E` vs Stitch `#005C55` / container split | S3 | Freeze product-approved `#0F766E` as primary; map Stitch `primary` carefully | Open |
| D06 | Official logo asset | Animated SVG extract vs PNG “Origional logo” | S3 | Extract vector from `animated_svg`; retire misspelt PNG as source | Open |
| D07 | Expo workflow | Expo Go vs Dev Client from start | S2 | Expo Go until native blockers; then prebuild | Open |
| D08 | Auth provider | Firebase Auth vs local-only demo auth | S6 / S14 | Local PIN + mock credentials for P0; Firebase when backend ready | Open |
| D09 | Backend for submission | Mock sync only vs FastAPI deployed | S14 | Prefer FastAPI if time; otherwise honest mock sync | Open |
| D10 | Cloud data store | Firestore vs Postgres via FastAPI | S14 | FastAPI + Postgres preferred for auditability; Firestore if speed wins | Open |
| D11 | Speech-to-text | Cloud STT / local Whisper / mock transcript | S11 | Mock or scripted transcript for P0; guided fallback always | Open |
| D12 | Danger-sign rules source | GHS / WHO IMNCI / labelled demo ruleset | S9 | Must be approved or clearly labelled “demonstration ruleset” | Open |
| D13 | Dagbanli content | Reviewed strings vs placeholders | S12 | Placeholders allowed if marked; no fabricated medical claims | Open |
| D14 | QR library | Candidate RN QR libs for offline encode | S10 | Evaluate maintained Expo-compatible lib in S10 spike | Open |
| D15 | i18n library | i18n-js vs others | S3–S4 | i18n-js is proposed, not confirmed | Open |
| D16 | Testing E2E | Maestro vs Detox vs manual-only for hackathon | S8/S19 | Manual + unit first; Maestro if time | Open |
| D17 | Monorepo layout | Root tooling + `northcare-app` vs flatten | S1 | Keep `northcare-app` as mobile package; docs at root | Open |
| D18 | Admin in MVP build | Include tab vs hide | S4/S16 | Hide or stub admin for P0 demo APK | Open |

## Confirmed (do not reopen without reason)

| Item | Status |
|---|---|
| Product name: NorthCare AI | Confirmed |
| Tagline: Smarter care. Stronger communities. | Confirmed |
| Platform: Android-first React Native + Expo + TypeScript | Confirmed |
| Offline-first local SQLite source of truth | Confirmed |
| No diagnose / no prescribe | Confirmed |
| Human review of AI extraction | Confirmed |
| Deterministic danger-sign engine (not LLM) | Confirmed |
| Stitch project ID `749026157623860355` as visual source of truth | Confirmed |
| Expo SDK currently installed: **57** in `northcare-app` | Observed |
| HTML Stitch exports are design references only — not a web app | Confirmed |

## Decision log format (for later)

```text
Date:
Decision ID:
Choice:
Rationale:
Approver:
Impacts stages:
```
