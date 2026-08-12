# Splash Foundation

**Stage:** 4  
**Last updated:** 2026-08-02  

## Native splash

Configured via `expo-splash-screen` in `apps/mobile/app.config.ts`:

- Image: approved NorthCare AI logo (`northcare-logo-symbol-primary.png`)
- Background: `#0F766E`
- Resize: contain
- Hidden when fonts are ready (`SplashScreen.hideAsync`)

## Custom splash

`apps/mobile/src/features/splash/CustomSplash.tsx`

- Soft primary background
- Logo fade + light scale (skipped when reduced motion)
- Amber accent bar
- Product name + tagline
- Message: “Preparing NorthCare AI…”
- Shortened path for returning users (no promotional pulse)
- No fake percentages

## Future refinement

- Optional Reanimated / approved SVG path construction after visual approval
- Final polish on a release build (Expo Go may differ)
