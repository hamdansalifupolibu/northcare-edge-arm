# Stitch Design Overview

## Summary

**Screens inspected:** 45 downloaded Stitch screens across the NorthCare AI project (ID: 749026157623860355)

**Screens containing visual UI designs (HTML):** 29
**Screens containing documentation/specifications (text/markdown):** 12
**Screens containing design system assets:** 2
**Duplicate or alternative variants:** ~10

## Screen Categories

### A. Documentation & Configuration (12 screens)

| Screen | Purpose | Status |
|---|---|---|
| `00_project_cover_and_read_me` | Master project ReadMe and handoff guide | Reference |
| `00_project_cover_and_read_me_1` | Alternative ReadMe with Cursor AI rule binding | Reference (alt) |
| `02_approved_asset_library` | Core asset manifest (5 assets) | Reference |
| `02_approved_asset_library_1` | Expanded asset manifest (8 assets + JSON schema) | Reference (final) |
| `03_design_tokens_json` | Machine-readable design token specification | **Authoritative** |
| `22_developer_handoff` | Implementation strategy, route map, component inventory | Reference |
| `22_developer_handoff_1` | Alternative handoff with Whisper strategy and checklist | Reference (alt) |
| `23_cursor_project_rules_mdc` | Coding standards and file structure rules | **Authoritative** |
| `24_final_quality_report` | QA audit (8 categories, 50+ screens) | Reference |
| `24_final_quality_report_1` | Expanded QA audit (10 categories, 60+ screens) | Reference (final) |
| `northcare_ai_information_architecture` | Complete 27-screen IA blueprint, personas, components | **Authoritative** |
| `design_audit_strategy` | Gap analysis, edge cases, naming convention, prototype journeys | Reference |

### B. Onboarding & Authentication (16 screens)

| Screen | Purpose | User | Status |
|---|---|---|---|
| `splash_screen` | Static splash with logo and loading | All | Draft |
| `splash_screen_1` | Alternative static splash with inline styling | All | Draft |
| `splash_screen_animated` | **Animated splash with cycling offline status messages** | All | **Final** |
| `animated_svg` | Standalone SVG logo animation (shield + mother/child + amber path) | System | **Asset** |
| `onboarding_1` | Slide 1: "Care begins close to home" — mission | Worker | **Final** |
| `onboarding_2` | Slide 2: "Built for frontline health workers" — features | Worker | **Final** |
| `onboarding_3` | Slide 3: "Reliable even without internet" — offline-first | Worker | **Final** |
| `workspace_selection` | Role selection: Worker vs Administrator | All | **Final** |
| `worker_login` | Credential login with biometric option | Worker | **Final** |
| `create_pin` | 6-digit PIN creation (step 3 of 10 setup wizard) | Worker | **Final** |
| `pin_unlock` | Daily offline PIN unlock for returning workers | Worker | **Final** |
| `privacy_consent` | Data privacy agreement with toggles | Worker | **Final** |
| `notification_permission` | System notification permission prompt | Worker | **Final** |
| `microphone_permission` | Microphone permission with privacy assurance | Worker | **Final** |
| `preparing_workspace` | Offline resource download progress (75% ring) | Worker | **Final** |
| `setup_complete` | Confirmation that offline workspace is ready | Worker | **Final** |

### C. Core Worker Features (11 screens)

| Screen | Purpose | Status |
|---|---|---|
| `worker_dashboard` | Central home: greeting, actions, priorities, stats, tip | **Final** |
| `client_directory` | Searchable client list with risk-colour filtering | **Final** |
| `client_profile` | Empty skeleton/template shell | Draft |
| `client_profile_amina_suleiman` | Complete profile: timeline, BP chart, risk alert | **Final** |
| `register_client_type` | Step 1/7: select client category (radio cards) | **Final** |
| `start_new_visit` | Visit entry: "Speak a Case" vs "Guided Questions" | **Final** |
| `voice_capture` | Voice recording with mic button, waveform, transcript | **Final** |
| `screening_result` | Risk result: Red/Amber/Green with danger signs, AI explainer | **Final** |
| `referral_passport` | Offline QR referral document with transit timeline | **Final** |
| `nutrition_planner` | Food diversity ring, local food chips, Dagbanli audio | **Final** |
| `ask_northcare_assistant` | Constrained AI chat with citations and suggestion chips | **Final** |

### D. System & Management (6 screens)

| Screen | Purpose | Status |
|---|---|---|
| `admin_dashboard` | Regional KPIs, facility health, referral trends | **Final** |
| `worker_management` | Worker table with sync freshness and facility assignments | **Final** |
| `notification_centre` | Alert inbox with colour-coded categories | **Final** |
| `sync_centre` | Storage metrics, sync-now button, sync history | **Final** |
| `system_states_conflicts` | Empty states + sync conflict resolution | **Final** |
| `health_worker_empowerment` | Master design system specification (DESIGN.md) | **Authoritative** |

---

## Major Visual Patterns

### Colour System (Material 3 Adapted)

| Token | Hex | Usage |
|---|---|---|
| Primary | `#005C55` / `#0F766E` | Brand teal — trust, healthcare authority |
| Primary Dark | `#115E59` | Headers, pressed states |
| Amber Accent | `#F59E0B` / `#ffb95f` | Guidance paths, active actions, warm accent |
| Background | `#F7FAF9` | Soft off-white canvas |
| Surface | `#FFFFFF` | Cards, modals, containers |
| Text Primary | `#17211F` / `#181C1C` | Dark charcoal body text |
| Text Secondary | `#52615E` / `#3E4947` | Muted grey captions |
| Danger Red | `#B42318` / `#BA1A1A` / `#DC2626` | Urgent danger signs, critical risk |
| Warning Amber | `#B54708` / `#F59E0B` | Moderate risk, pending sync |
| Success Green | `#067647` / `#10B981` | Stable health, synced status |

### Typography

- **Font family:** Plus Jakarta Sans (sole typeface)
- **Scale:** headline-lg (32px/700), headline-md (24px/600), headline-sm (20px/600), body-lg (16px/400), body-md (14px/400), label-lg (14px/600), label-md (12px/500)

### Layout Patterns

- **Touch targets:** Minimum 48dp for all interactive elements
- **Margins:** 16px mobile, 24px tablet
- **Card padding:** 20px
- **Border radius:** 8px (sm), 12px (md), 16px (lg), 999px (pill)
- **Elevation:** Tonal layers rather than heavy drop shadows

### Navigation

- **Bottom navigation (5 tabs):** Home, Clients, Assistant, Referrals, More
- **Top app bar:** Logo + app name + sync status + profile avatar
- **Back navigation:** Arrow-back button in top-left

---

## Major Workflow Patterns

1. **Onboarding flow:** Splash → 3 value-prop slides → Workspace selection → Login → PIN → Privacy → Permissions → Download → Complete
2. **Visit flow:** Dashboard → Client → Start Visit → Voice/Guided → Risk Result → Referral → Save
3. **Referral lifecycle:** Created → Informed → En Route → Arrived → Received → Completed
4. **Nutrition flow:** Client → Assessment → Food diversity ring → Local guidance → Dagbanli audio → Follow-up
5. **Sync flow:** Local save → Queue → Online detection → Sync → Confirm / Conflict resolution

---

## Design Tokens Discovered

Extracted from `03_design_tokens_json` and `health_worker_empowerment/DESIGN.md`:

- Complete colour palette (10 core tokens + full Material 3 tonal palette)
- Spacing scale (xs:4, sm:8, md:12, base:16, lg:24, xl:32)
- Border radius scale (sm:8, md:12, lg:16, pill:999)
- Typography scale (7 levels from caption to display)
- Touch target minimum (48dp)
- Elevation strategy (tonal layers, not shadows)

---

## Important Reusable Components

From Stitch designs:

| Component | Description | Used In |
|---|---|---|
| `NorthCareLogo` | Primary brand vector asset | Header, splash, onboarding |
| `RiskCard` | Red/Amber/Green status container with left colour bar | Dashboard, client list, screening result |
| `SyncIndicator` | Online/offline status badge with sync action | Header, dashboard, sync centre |
| `VoiceWaveform` | Animated audio recording visualiser | Voice capture, onboarding slide 2 |
| `PINKeypad` | 6-digit numeric entry with dot display | Create PIN, PIN unlock |
| `ClientCard` | Client summary with risk colour bar | Client directory |
| `ReferralTimeline` | Step-by-step referral status nodes | Referral passport |
| `NutritionRing` | SVG donut chart for food diversity | Nutrition planner |
| `OfflineBanner` | Slim connectivity status strip | Dashboard, forms, screening |
| `StepProgress` | Progress bar with step counter | Registration, setup wizard |
| `FilterChips` | Category filter pill buttons | Client directory, notifications |
| `ActionGrid` | 2×2 primary action button grid | Dashboard |

---

## Duplicate or Alternative Screens

| Screen | Duplicate Of | Notes |
|---|---|---|
| `splash_screen` | `splash_screen_animated` | Static draft; animated version is final |
| `splash_screen_1` | `splash_screen_animated` | Alternative static draft |
| `00_project_cover_and_read_me_1` | `00_project_cover_and_read_me` | Adds Cursor AI rules |
| `02_approved_asset_library_1` | `02_approved_asset_library` | Expanded with JSON schema |
| `22_developer_handoff_1` | `22_developer_handoff` | Adds Whisper strategy + checklist |
| `24_final_quality_report_1` | `24_final_quality_report` | Expanded with animation + prototype items |
| `client_profile` | `client_profile_amina_suleiman` | Empty skeleton vs populated profile |

---

## Missing States Identified

From the design audit strategy and screen inspection:

- AUTH: Forgot password, incorrect PIN/password, biometric failure
- SETUP: Password change, facility confirmation
- CLIENT: Specific intake forms for pregnant / postnatal / newborn (only type selection shown)
- CLIENT: Duplicate client warning, informed consent, archive confirmation
- VOICE: Recording paused, processing failure, permission denied
- SCREENING: Save draft state, resume draft state
- SCREENING: Guided question forms (only voice and result shown)
- SYNC: Storage full state, retry animation
- NOTIFICATIONS: Notification detail view
- ADMIN: Facility management screen (mentioned in IA but not in downloaded screens)
- SETTINGS: Settings screen (mentioned in IA but not in downloaded screens)

---

## Assets Requiring Manual Review

1. **Logo SVG:** The animated SVG in `animated_svg/code.html` contains the official vector logo — needs extraction
2. **Onboarding photos:** 3 hero images referenced in asset manifest (webp format)
3. **Client photos:** Synthetic portrait images used in dashboard and profiles
4. **Map graphic:** Northern Ghana belt SVG referenced in asset manifest
5. **Risk icons:** Red danger icon SVG referenced in asset manifest
6. **Material Symbols:** Google Material Symbols Outlined font used throughout

---

## How the Design Will Influence React Native Implementation

1. **Colour tokens** → `src/constants/theme.ts` — all values from design tokens JSON
2. **Typography scale** → Custom text components using Plus Jakarta Sans with 7 named sizes
3. **Spacing scale** → Reusable spacing constants throughout layouts
4. **Bottom navigation** → React Navigation bottom tab navigator (5 tabs)
5. **Card patterns** → Reusable Card, RiskCard, ClientCard components
6. **Touch targets** → Minimum 48dp enforced on all pressable elements
7. **Risk colours** → Shared danger/warning/success semantic colour mapping
8. **Offline indicators** → `useOfflineStatus` hook powering banners and badges
9. **PIN keypad** → Custom numeric input component
10. **Voice waveform** → Animated recording indicator component
11. **QR generation** → Offline QR code component for referral passport
12. **SVG nutrition ring** → React Native SVG donut chart component
13. **Sync states** → Visual status indicators throughout the app
