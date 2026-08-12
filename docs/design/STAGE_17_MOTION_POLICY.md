# Stage 17 — Motion policy

**Product:** NorthCare AI  
**Updated:** 2026-08-02  

## Principles

1. Motion communicates state (entrance, selection, splash readiness). It does not decorate.
2. Critical information must never depend only on animation.
3. Prefer OS reduce-motion: skip or shorten motion when enabled.
4. No fake loading percentages, looping decorative animations, or delayed “success” that hides failure.
5. Prefer **React Native `Animated`** already in the app. Do not add Lottie, Reanimated, or other motion libraries for Stage 17 polish.

## Tokens

Source: `apps/mobile/src/theme/motion.ts`

| Token group | Values | Use |
|---|---|---|
| `duration.fast` | 120 ms | Micro feedback |
| `duration.standard` | 200 ms | Entrance / standard transitions |
| `duration.emphasised` | 280 ms | Splash emphasis only when motion allowed |
| `duration.slow` | 400 ms | Rare; avoid for routine UI |
| `distance.entrance` | 8 dp | Subtle entrance translate |
| `scale.press` / `scale.entrance` | 0.98 | Optional press / splash scale |

Hook: `useReducedMotion()` in `apps/mobile/src/theme/useReducedMotion.ts`.

Component: `EntranceMotion` in `apps/mobile/src/design-system/motion/EntranceMotion.tsx`.

## Approved motion surfaces (Stage 17)

| Surface | Motion | Reduce-motion |
|---|---|---|
| Custom splash | Fade + light scale (existing) | Instant settle + short delay |
| Workspace selection | Entrance fade/slide | Static render |
| Session workspace switch | Entrance fade/slide | Static render |
| Password visibility | Instant toggle (no animation required) | N/A |
| Loading / sync / offline | No decorative motion; truthful copy only | N/A |

## Forbidden

- Motion that implies sync/AI/voice success when the operation did not complete
- Celebratory confetti or continuous ambient loops
- Converting Stitch HTML/CSS animations into production RN without rebuild + approval
- New motion packages without an approved dependency change

## Stage 18 note

TalkBack timing, contrast of motion affordances, and broader a11y motion audit remain Stage 18.
