# NorthCare AI Assets

Organised production and reference assets for the Android-first React Native / Expo app.

## Structure

```text
assets/
  brand/logos/           Brand symbol + stacked logos (+ Stitch SVG extracts)
  brand/app-icon/        Adaptive icon layers + previews
  images/onboarding/     Onboarding photography / art
  icons/risk/            Red / Amber / Green priority SVGs
  maps/ghana/            Ghana regional SVGs (CC BY-SA attribution required)
  audio/dagbanli/        Audio placeholders (no recordings yet)
  source-references/     Reference-only composites
  source-originals/      Preserved original root filenames (incl. double extensions)
```

## Rules

- Canonical logo (interim): `brand/logos/northcare-logo-symbol-primary.png`.
- Stitch SVGs require visual approval before replacing the PNG.
- Do not forge or redraw the NorthCare AI logo.
- Do not treat artistic onboarding maps or care-network paths as geospatial truth.
- Prefer onboarding **WebP** where present; PNG counterparts may remain as fallbacks.
- Do not use app-icon **preview** files as adaptive layers.
- Adaptive FG + teal/light backgrounds are organised; final teal vs light selection needs approval.
- Do not use frontline overlay composites as production backgrounds.
- Do not fabricate Dagbanli translations or audio.
- Client portrait photos are **not required** for MVP (use initials avatar later).
- Map attribution: see `docs/licenses/MAP_LICENSE_AND_ATTRIBUTION.md`.

## Manifest

Machine-readable inventory: `implementation/asset-manifest.json`  
Human audit: `docs/ASSET_AUDIT.md`  
Outstanding later-stage items: `docs/MANUAL_ASSETS_REQUIRED.md`
