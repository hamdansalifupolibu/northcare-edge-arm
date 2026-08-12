# Stage 17 — Stitch screen map and visual validation matrix

**Stitch project:** `749026157623860355`  
**URL:** https://stitch.withgoogle.com/projects/749026157623860355  
**Audited:** 2026-08-02 via Stitch MCP `list_screens`  
**Rule:** Stitch HTML/PNG is visual reference only — not converted to React Native or a website.

## Inventory counts

| Category | Count | Notes |
|---|---:|---|
| Total Stitch entries | **57** | Includes duplicates, docs, and asset placeholders |
| UI / product screens (approx.) | **34** | Includes long generative titles for permission/consent variants |
| Documentation / handoff boards | **12** | Cover, tokens, audits, quality reports |
| Asset / image placeholders | **11** | ChatGPT PNGs, logo, Animated SVG, etc. |
| Duplicate titles | **5** | e.g. Splash Screen, Developer Handoff, Asset Library |

## Mapping status legend

| Status | Meaning |
|---|---|
| IMPLEMENTED | App route/feature covers intent with design tokens |
| PARTIAL | Functional coverage; visual density/motion still simplified vs Stitch |
| REFERENCE_ONLY | Design/docs/asset board — not an app screen |
| DEFERRED_STAGE_18 | Remaining a11y/contrast/hardening polish |
| OUT_OF_SCOPE | Not product UI (partner logos, generative fluff, forged marks) |

## Product UI map

| Stitch title | App route / surface | Status | Stage 17 notes |
|---|---|---|---|
| Splash Screen / Splash Screen (Animated) | `/(entry)/splash`, `CustomSplash` | PARTIAL | RN Animated + reduce-motion; not Stitch CSS |
| Preparing Workspace | Launch hydrate / splash messaging | PARTIAL | Truthful prepare copy; no fake % |
| Onboarding 1–3 | `/(entry)/onboarding/*` | IMPLEMENTED | Token spacing; frontline hero still temporary |
| Workspace Selection | `/(entry)/workspace-selection` | IMPLEMENTED | Selection emphasis + EntranceMotion; no auto-admin |
| Worker Login | `/(auth)/worker-login` | IMPLEMENTED | PasswordField show/hide |
| Admin Dashboard | `/(admin)` | PARTIAL | Functional home + counts; denser Stitch chrome simplified |
| Worker Management | `/(admin)/accounts` | PARTIAL | List density via PressableCard; filters remain practical |
| Worker Dashboard | `/(worker)` | PARTIAL | Clear active workspace label; action list |
| Client Directory | `/(worker)/clients` | IMPLEMENTED | Existing Stage 7 UI |
| Client Profile (+ named example) | `/(worker)/clients/[id]` | IMPLEMENTED | Synthetic clients only; Stitch name is reference |
| Register Client: Type | Client registration flow | IMPLEMENTED | Guided register wizard |
| Start New Visit | Visit start | IMPLEMENTED | Stage 8 |
| Screening Result | Risk / screening summary | IMPLEMENTED | Deterministic risk badges |
| Voice Capture | Voice-to-Care screens | PARTIAL | Functional; mic permission copy truthful |
| Microphone Permission (variants) | System + in-app consent | PARTIAL | OS dialog + app explanations |
| Nutrition Planner | Nutrition assessment surfaces | PARTIAL | Reviewed guidance only; Stitch planner chrome simplified |
| Ask NorthCare Assistant | `/(worker)/ask` | PARTIAL | Constrained assistant; not free chat chrome |
| Referral Passport | Referral passport screens | IMPLEMENTED | Stage 10 |
| Sync Centre | `/(worker)/sync-centre` | IMPLEMENTED | Truthful sync copy preserved |
| System States & Conflicts | Sync conflicts + AppStateView | IMPLEMENTED | Failures never look successful |
| Notification Centre | Reminder Centre | PARTIAL | Privacy-safe reminders; Stitch “alerts” not clinical push |
| Notification Permission (variants) | Reminder permission UX | PARTIAL | Generic notification wording |
| Create PIN / PIN Unlock / Setup Complete | Auth PIN / unlock / setup | IMPLEMENTED | PIN remains separate from PasswordField |
| Privacy & Consent / Data Privacy variants | Onboarding / voice consent | PARTIAL | Product consent; not Stitch legal prose dump |
| Session workspace (app-only) | `/(entry)/session-workspace` | IMPLEMENTED | Dual-role post-login; clears history on switch |

## Non-UI Stitch entries (reference only)

Documentation boards (CURSOR rules, asset library, design tokens JSON board, developer handoff, final quality report, project cover, design audit, IA) and asset placeholders (ChatGPT images, Origional logo.png, Animated SVG) are **REFERENCE_ONLY / OUT_OF_SCOPE**. They must not be implemented as screenshots or websites.

## Visual validation matrix (demo path)

| Journey step | Stitch reference | App validation | Result |
|---|---|---|---|
| Splash | Splash Screen | Brand logo + tagline + reduce-motion | Pass (simplified motion) |
| Onboarding | Onboarding 1–3 | Three screens, skip/next | Pass |
| Workspace choose | Workspace Selection | Clear selected card; continue disabled until select | Pass |
| Worker login | Worker Login | Password hidden by default; show/hide control | Pass |
| Worker home | Worker Dashboard | Active workspace label; no fake sync success | Pass |
| Clients → profile | Client Directory / Profile | Synthetic data only | Pass |
| Visit / screening / risk | Start New Visit / Screening Result | Existing flows unchanged | Pass (rules untouched) |
| Referral passport | Referral Passport | Existing Stage 10 | Pass |
| Sync centre / conflicts | Sync Centre / System States | Truthful offline/fail copy | Pass |
| Reminders | Notification Centre | Privacy notice; monochrome status icon wired | Pass (device icon needs rebuild) |
| Admin home / accounts | Admin Dashboard / Worker Management | Active workspace; PasswordField on temp passwords | Pass (density PARTIAL vs Stitch) |
| Dual-role switch | Workspace / session workspace | Explicit select; no auto-admin | Pass |

## Known intentional differences

- Stitch generative long titles are collapsed into product copy in `en.ts`.
- Material Symbols icon font not bundled (Stage 18 / later).
- No conversion of Stitch HTML to RN layouts.
- Canonical logo remains interim PNG; SVG still requires visual approval.

## Backlog after Stage 17

See `docs/design/POST_STAGE_UI_UX_BACKLOG.md` (Stage 17 items closed or reduced) and Stage 18 hardening scope.
