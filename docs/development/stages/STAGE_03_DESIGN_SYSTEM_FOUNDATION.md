# STAGE 03 — Design Tokens and Reusable Component Foundation

**Status:** COMPLETE — awaiting Stage 4 approval  
**Last reviewed:** 2026-08-02  

## Purpose

Translate approved Stitch / product design tokens into a typed React Native theme and reusable component foundation for NorthCare AI.

## Outcome

| Item | Result |
|---|---|
| Stitch pattern audit | `docs/design/STITCH_COMPONENT_PATTERN_AUDIT.md` |
| Theme tokens | `apps/mobile/src/theme/*` |
| Token manifest | `implementation/design-tokens.json` (aligned) |
| Design system | `apps/mobile/src/design-system/*` |
| Dev preview | `DesignSystemPreviewScreen` (diagnostics / non-production only) |
| Fonts | Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans` + `expo-font` |
| SVG | `react-native-svg` typed risk icons (no transformer) |
| Safe area | `react-native-safe-area-context` |
| Inventory | `implementation/component-inventory.json` |
| Docs | DESIGN_TOKENS, COMPONENT_LIBRARY, ICON_SYSTEM, a11y, localisation, location decision |

## Explicit non-goals (enforced)

No onboarding, auth, clients, screening, risk calculation, referrals, nutrition, voice, AI, sync queue, notifications, admin, SQLite, Firebase, FastAPI, website, or Stage 4 navigation shell.

## Packages added

| Package | Why |
|---|---|
| `react-native-svg` | Approved risk SVG presentation |
| `react-native-safe-area-context` | Screen safe areas |
| `expo-font` | Load Plus Jakarta Sans |
| `@expo-google-fonts/plus-jakarta-sans` | Stitch-approved typeface |

## Next stage

**Stage 4 — Navigation, Splash, Onboarding and Application Shell** — not started; requires approval.
