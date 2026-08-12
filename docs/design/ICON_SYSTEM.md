# Icon System

**Stage:** 3  
**Last reviewed:** 2026-08-02  

## Primary approach

Stitch screens use **Material Symbols Outlined**. Stage 3 does **not** add a second icon framework or generate bitmap icons.

For foundation components:

1. Prefer **text/glyph cues** bundled with status components (non-colour indicators)
2. Prefer **typed SVG components** for approved custom marks (risk icons)
3. Prefer **ReactNode slots** (`leadingIcon`, `IconButton` children) so Stage 4+ can pass a single icon family without API churn

## Standard sizes

| Token | Size |
|---|---|
| `layout.iconSizeSm` | 16 |
| `layout.iconSizeMd` | 24 |
| `layout.iconSizeLg` | 32 |

Touch targets remain ≥ 48dp even when the glyph is smaller (`IconButton`).

## Style

- Prefer outlined / stroke metaphors matching Stitch calm clinical UI
- No decorative AI sparkles, brains, robots, or circuit symbols
- Do not mix unrelated icon packs in one screen

## Exceptions

| Set | Source | Notes |
|---|---|---|
| Risk icons | `assets/icons/risk/*.svg` → `RiskIcon` (react-native-svg) | Approved custom SVGs |
| Brand logo | Canonical PNG via `NorthCareLogo` | Not an icon font |

## Accessibility

- Every interactive icon control needs `accessibilityLabel`
- Decorative icons: hide from accessibility tree
- Status must include text or glyph + text — never colour alone

## Custom SVG policy

Custom SVG is permitted when:

- Asset is approved in `implementation/asset-manifest.json`, or
- It is a typed recreation of an approved asset (risk icons)

Avoid SVG transformers unless a clear Stage need appears. Stage 3 uses `react-native-svg` primitives.
