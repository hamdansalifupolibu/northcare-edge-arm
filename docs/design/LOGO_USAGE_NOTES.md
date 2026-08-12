# Logo Usage Notes

## Approved product spelling

**NorthCare AI**

Reject: North Care AI · NorthCareAI · NorthCare Al · NorthCare A1 · NorthCareBridge AI · NorthCare Ghana

## Canonical source of truth (interim approved)

**Canonical brand mark:**

`assets/brand/logos/northcare-logo-symbol-primary.png`

Do **not** replace this PNG throughout the application without explicit approval.

## Available files

| File | Classification / use |
|---|---|
| `northcare-logo-symbol-primary.png` | **CANONICAL** · PRODUCTION READY |
| `northcare-logo-symbol-cropped.png` | PRODUCTION CANDIDATE (compact) |
| `northcare-logo-stacked-transparent.png` | PRODUCTION CANDIDATE |
| `northcare-logo-stacked-white-background.png` | REFERENCE ONLY (white surfaces) |
| `northcare-logo-symbol-primary.svg` | **VECTOR CANDIDATE — REQUIRES VISUAL APPROVAL** |
| `northcare-splash-logo.svg` | **ANIMATION CANDIDATE — REQUIRES REACT NATIVE REBUILD AND VISUAL APPROVAL** |

## Do

- Prefer the canonical transparent PNG on coloured/photo backgrounds.  
- Keep mother-and-child negative space, amber curve, and Ghana-related silhouette intact.  

## Do not

- Redraw, trace, simplify, recolour, or add glow/shadow/medical-cross/AI-sparkle treatments.  
- Use the white-background stacked logo over photography.  
- Use stacked wordmark as Android adaptive **foreground**.  
- Silently replace the canonical PNG with Stitch SVG outputs.  

## PNG vs Stitch SVG — visual comparison note

| Aspect | Canonical PNG | Stitch SVG (`northcare-logo-symbol-primary.svg` / splash) |
|---|---|---|
| Similarities | Teal Ghana-related outer form; mother–child motif; amber accent curve; no wordmark on symbol | Same brand intent and colour family (`#0F766E` / `#F59E0B`) |
| Path geometry | Photographic / detailed silhouette (raster) | Simplified geometric Bézier paths (vector) |
| Colour treatment | Flat teal fill + white/black figure treatment in PNG | Linear gradient fill (`#0f766e` → `#064e49`) + white cut-out + amber path |
| Internal proportions | Detailed mother/child/hand relationship inside map heart | More abstract oval cut-outs; proportions differ visibly from PNG |
| Safe for splash animation? | Excellent static mark | Geometry usable for RN rebuild **after visual approval**; current CSS keyframes are web-only |

**Decision:** PNG remains canonical. SVG remains a candidate pending side-by-side visual approval. No silent brand switch.

## Future component names

- `NorthCareLogo` — `variant="symbol" | "stacked"` reading the canonical PNG by default  
- Splash animation may later use approved SVG layer geometry via React Native SVG + Reanimated  

## Adaptive icon

Foreground: `assets/brand/app-icon/northcare-adaptive-icon-foreground.png` (transparent symbol).  
Backgrounds: teal `#0F766E` and light `#F7FAF9` both available; final pairing pending approval.
