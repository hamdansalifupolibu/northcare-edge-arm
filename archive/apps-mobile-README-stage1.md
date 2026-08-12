# apps/mobile

**Purpose:** Future home of the Android-first React Native + Expo application for NorthCare AI.  
**Status:** Placeholder — Expo project not created in this folder during Stage 1.

## Current state

An existing Expo SDK 57 scaffold currently lives at repository root as:

`northcare-app/`

That scaffold is **hello-world only**. Stage 2 will establish the Expo TypeScript foundation and decide whether to:

1. Migrate `northcare-app/` into `apps/mobile/`, or  
2. Harden `northcare-app/` in place and treat this folder as the long-term path after migration.

## Future responsibility

- Screens and navigation  
- Mobile UI components  
- Repository-mediated local data access (SQLite)  
- Auth / PIN unlock UX  
- Offline clinical workflows  
- Voice capture, referrals, nutrition, notifications  
- Mobile unit / component / E2E tests  

## Out of scope for Stage 1

Do not initialise Expo here. Do not install packages. Do not create fake `src/` trees claiming implementation has begun.
