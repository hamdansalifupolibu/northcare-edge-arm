# Asset Audit

**Date:** 2026-08-02  
**Task:** Focused NorthCare AI asset verification, classification, organisation, handoff  
**Stitch project:** `749026157623860355`

## Summary

Root-level prepared assets were inspected (format, dimensions, transparency, checksums), organised into `assets/`, archived under `assets/source-originals/` / `assets/source-references/`, and catalogued in `implementation/asset-manifest.json`.

No application functionality was implemented. No logos, photos, maps, risk icons, translations, or audio were generated.

## Root discovery

### Found (usable / mapped)

| Root filename | Action |
|---|---|
| `northcare-logo-symbol-primary.png` | → `assets/brand/logos/` |
| `northcare-logo-symbol-cropped.png` | → `assets/brand/logos/` |
| `northcare-logo-stacked-transparent.png` | → `assets/brand/logos/` |
| `northcare-logo-stacked-white-background.png` | → `assets/brand/logos/` |
| `northcare-adaptive-icon-background-light.png` | → `assets/brand/app-icon/` |
| `northcare-app-icon-preview-teal.png` | → `assets/brand/app-icon/` |
| `northcare-app-icon-preview-light.png` | → `assets/brand/app-icon/` |
| `maternal-child-onboarding-approved.png.png` | → `assets/images/onboarding/onboarding-maternal-child-care.png` + archive |
| `offline-connectivity-composite-reference.png.png` | → `assets/images/onboarding/onboarding-offline-connectivity.png` + archive |
| `frontline-worker-overlay-reference.png.png` | → `assets/source-references/…` + archive |
| `ghana-regions-outline.svg` | → `assets/maps/ghana/` |
| `northern-ghana-highlight.svg` | → `assets/maps/ghana/` |
| `northern-care-network.svg` | → `assets/maps/ghana/` (duplicate bytes) |
| `risk-*-*.svg` (3) | → `assets/icons/risk/` |

### Found but not production destinations

| Root filename | Issue | Archive |
|---|---|---|
| `northcare-logo-symbol.png.png` | Double extension; alternate symbol export | `source-originals/` |
| `northcare-logo-symbol-transparent.png.png` | Name claims transparent; **RGB, no alpha** | `source-originals/` |
| `northcare-app-icon-background.png.png` | Not solid teal adaptive plate | `source-originals/` |

### Expected but not found

- `northcare-adaptive-icon-foreground.png`
- `northcare-adaptive-icon-background-teal.png`
- `onboarding-maternal-child-care.webp`
- `onboarding-offline-connectivity.webp`
- `onboarding-frontline-worker-reference-only.webp`
- Root `MAP_LICENSE_AND_ATTRIBUTION.md` (restored from SVG metadata → `docs/licenses/`)
- Root `asset-manifest.json` / root asset `README.md` (created in proper locations)

## Verification highlights

### Transparency

| File | Result |
|---|---|
| Logo symbol primary | **True alpha** (RGBA, transparent corners) |
| Logo symbol cropped | **True alpha** |
| Stacked transparent | **True alpha** |
| Stacked white-background | Opaque RGB |
| Misnamed `…transparent.png.png` | **No alpha** (misleading) |
| Adaptive light background | Opaque solid `#F7FAF9` |

### Dimensions (selected)

| File | Size |
|---|---|
| Logo primary / stacked | 1448×1086 |
| Logo cropped | 561×663 |
| Adaptive light BG / previews | 1024×1024 |
| Onboarding PNGs | 941×1672 (~9:16) |
| Risk SVGs | viewBox `0 0 96 96` |
| Map SVGs | viewBox `0 0 1000 1454` |

### SVG validation

| Asset | Script | Remote image | Title / metadata |
|---|---|---|---|
| Risk icons | None | None | Accessible `<title>` present; colours match expected tokens |
| Ghana maps | None | None (xmlns/licence text only) | `<metadata>` CC BY-SA attribution present |
| Stitch logo SVG | CSS in splash extract | None | Paths + gradient preserved |

### Critical conflicts

1. **`northern-care-network.svg` ≡ `northern-ghana-highlight.svg`** (identical SHA-256). Distinct care-network artwork still missing.  
2. **Photographic PNG logo ≠ Stitch stylized SVG logo** — both preserved; choose per surface carefully.  
3. **WebP onboarding files absent** — PNG equivalents organised with honest `.png` filenames.

## Stitch logo extraction

Source: `stitch-exports/assets/animated_svg/code.html`

Extracted:

- `assets/brand/logos/northcare-logo-symbol-primary.svg` (static, CSS removed)
- `assets/brand/logos/northcare-splash-logo.svg` (includes CSS keyframes — **web-oriented**)

Status: vector geometry recovered from Stitch. Not a PNG trace. Still confirm which mark is canonical vs the photographic PNG symbol.

## Adaptive icon readiness

| Layer | Status |
|---|---|
| Foreground | **Missing** |
| Teal background `#0F766E` | **Missing** |
| Light background `#F7FAF9` | Present |
| Previews | Present (reference only) |

**Recommendation:** Prefer **teal** as the primary Android launcher configuration for brand recognition at small sizes (based on teal preview readability). Final choice deferred until a true foreground + teal background plate exist. Interim foreground candidate: cropped transparent symbol (not yet copied into `app-icon/` to avoid inventing a missing deliverable).

## Onboarding readiness

| Screen | Asset | Ready? |
|---|---|---|
| 1 | Maternal-child PNG | Yes (candidate) |
| 2 | Clean frontline photo | **No** — reference overlay only |
| 3 | Offline connectivity art PNG | Yes (candidate; non-authoritative map) |

## Geographic / risk / audio

- Maps organised + attribution document restored.  
- Risk SVGs production-ready.  
- Dagbanli audio: folder + empty manifest only.

## Cleanup

Loose asset files removed from repository root after checksum-verified copies. Helper scripts used during this task should be deleted after documentation (see final report).

---

## Close-out (2026-08-02)

Six newly supplied root files were verified, organised, and registered. Root is clean of loose media again.

| Supplied file | Destination | Verification |
|---|---|---|
| `northcare-adaptive-icon-foreground.png` | `assets/brand/app-icon/` | PNG 1024² RGBA; real alpha; symbol only; no wordmark; centred padding |
| `northcare-adaptive-icon-background-teal.png` | `assets/brand/app-icon/` | Solid `#0F766E` (15,118,110); unique_colors=1 |
| `onboarding-maternal-child-care.webp` | `assets/images/onboarding/` | WEBP 941×1672; text-safe lower band |
| `onboarding-offline-connectivity.webp` | `assets/images/onboarding/` | WEBP 941×1672; artistic; non-authoritative map |
| `onboarding-frontline-worker-reference-only.webp` | `assets/source-references/` | REFERENCE ONLY (overlays) |
| `northern-care-network-corrected.svg` | `assets/maps/ghana/northern-care-network.svg` | Distinct from highlight; Community/CHPS/Facility nodes; decorative-path disclaimer in `<desc>` |

Previous duplicate care-network archived at:

`assets/source-originals/maps/northern-care-network-duplicate-original.svg`

**Adaptive-icon recommendation (not applied):** prefer **teal** background for launcher brand recognition; final selection needs approval.

**Logo interim decision:** canonical mark = `northcare-logo-symbol-primary.png`. Stitch SVGs require visual approval / RN rebuild.
