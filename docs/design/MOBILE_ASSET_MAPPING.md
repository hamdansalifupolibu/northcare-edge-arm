# Mobile Asset Mapping

**Stage:** 4  
**Last updated:** 2026-08-02  

## Policy

Authoritative brand assets remain in repository `assets/`.

Only Metro-reachable runtime copies required by the Expo app are placed under `apps/mobile/assets/`.

Do not move the authoritative library without updating `implementation/asset-manifest.json`.

## Stage 2–3 runtime mapping

| Purpose | Source (authoritative) | Runtime (Expo) |
|---|---|---|
| Canonical logo | `assets/brand/logos/northcare-logo-symbol-primary.png` | `apps/mobile/assets/brand/northcare-logo-symbol-primary.png` |
| Stacked logo (candidate) | `assets/brand/logos/northcare-logo-stacked-transparent.png` | `apps/mobile/assets/brand/northcare-logo-stacked-transparent.png` |
| Adaptive icon (white launcher) | `assets/brand/app-icon/northcare-app-icon-preview-light.png` | `apps/mobile/assets/app-icon/northcare-app-icon-preview-light.png` |
| Adaptive icon foreground (teal blob — legacy) | `assets/brand/app-icon/northcare-adaptive-icon-foreground.png` | Do **not** use for launcher; teal-blob layer only |
| Adaptive icon teal background (legacy) | `assets/brand/app-icon/northcare-adaptive-icon-background-teal.png` | Do **not** use; replaced by `#FFFFFF` |
| Risk icons (reference SVG) | `assets/icons/risk/*.svg` | `apps/mobile/assets/icons/risk/*.svg` (reference; runtime uses typed `RiskIcon`) |
| Onboarding maternal hero | `assets/images/onboarding/onboarding-maternal-child-care.webp` | `apps/mobile/assets/images/onboarding/onboarding-maternal-child-care.webp` |
| Onboarding offline hero | `assets/images/onboarding/onboarding-offline-connectivity.webp` | `apps/mobile/assets/images/onboarding/onboarding-offline-connectivity.webp` |

## Not copied into the mobile app

- Full Stitch export tree
- Preview-only icon composites
- Source originals / frontline-worker **reference-only** WebP (embedded UI chips)
- Audio / map libraries

## Process for future assets

1. Approve/classify in `assets/` + manifest  
2. Copy only runtime-required files into `apps/mobile/assets/`  
3. Update this mapping document  
4. Reference via Metro-supported relative `require(...)` paths
