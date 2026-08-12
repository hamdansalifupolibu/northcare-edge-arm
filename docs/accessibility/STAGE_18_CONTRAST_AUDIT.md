# Stage 18 — Colour Contrast Audit

**Updated:** 2026-08-02  
**Method:** Token review against approved palette in `apps/mobile/src/theme/colors.ts` + semantic usage  
**Tooling:** Manual/token review (no formal WCAG lab measurement claimed)

## Token pairs reviewed

| Pair | Approx intent | Notes |
|---|---|---|
| `textPrimary` `#17211F` on `background` `#F7FAF9` | Body text | High contrast intended |
| `textSecondary` `#52615E` on background/surface | Secondary | Used for supporting copy |
| `textInverse` on `primary` `#0F766E` | Primary buttons | Inverse text on teal |
| `danger` `#B42318` on `dangerBackground` | Errors | Accompanied by alert text, not colour alone |
| `warning` / `success` status chips | Status | Prefix glyphs provide non-colour cue |

## Findings

- Status chips and risk badges include textual/glyph prefixes — status is not colour-only.
- Disabled text uses `disabled` grey — acceptable for disabled controls when `accessibilityState.disabled` is set.
- Accent amber is not used as sole meaning for errors.

## Residual

- Formal contrast ratio measurement with laboratory tooling: **not performed**
- Large-text + low-contrast OEM overlays: physical validation deferred
