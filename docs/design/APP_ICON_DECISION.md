# App Icon Decision

**Stage:** 2 interim decision  
**Last updated:** 2026-08-02  

## Decision

For the development build, NorthCare AI uses:

| Layer | Asset / value |
|---|---|
| Foreground | `assets/brand/app-icon/northcare-adaptive-icon-foreground.png` |
| Background colour | `#0F766E` (approved teal primary) |
| Background image (runtime copy) | `northcare-adaptive-icon-background-teal.png` |

Runtime copies used by Expo live under:

```text
apps/mobile/assets/app-icon/
```

Authoritative source assets remain under repository `assets/brand/app-icon/`.

## Why teal

Teal `#0F766E` offers stronger launcher recognition than the light plate and matches the NorthCare AI primary colour.

## Explicitly not used as launcher icon

- Full wordmark
- White-background stacked logo
- App-icon preview images as production icons
- Regenerated logos
- Extracted SVG logo without approval

## Release note

**Final launcher review will still occur before public release.**
