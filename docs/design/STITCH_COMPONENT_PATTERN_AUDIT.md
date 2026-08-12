# Stitch Component Pattern Audit

**Stage:** 3  
**Last reviewed:** 2026-08-02  
**Stitch project:** `749026157623860355`  

## Sources reviewed

| Source | Path / ID | Role |
|---|---|---|
| Design tokens JSON | Stitch screen `03 — DESIGN_TOKENS.json` | Authoritative numeric tokens |
| Design overview | `docs/design/STITCH_DESIGN_OVERVIEW.md` | Pattern summary across ~45 screens |
| Product palette | Stage 3 brief + `implementation/design-tokens.json` | Approved brand colours |
| Asset manifest | `implementation/asset-manifest.json` | Logo / risk icon authority |
| Logo notes | `docs/design/LOGO_USAGE_NOTES.md` | Canonical PNG policy |

**Note:** Local `stitch-exports/` HTML tree is referenced in README but was not present as a populated folder during Stage 3. Audit used Stitch MCP + existing design docs.

## Approved and consistent

| Pattern | Value / behaviour | Token mapping |
|---|---|---|
| Primary teal | `#0F766E` | `colors.primary` / `action.primary` |
| Dark / pressed teal | `#115E59`, `#064E49` | `primaryDark`, `primaryDarker` |
| Amber accent | `#F59E0B` / light `#FEF3C7` | `accent`, `accentLight` |
| Canvas / surface | `#F7FAF9` / `#FFFFFF` | `background`, `surface` |
| Text | `#17211F` / `#52615E` | `textPrimary`, `textSecondary` |
| Border / muted | `#DDE7E4` / `#EEF5F3` | `border`, `mutedSurface` |
| Status colours | urgent / warning / stable / info | `status.*` |
| Font | Plus Jakarta Sans | `typography.fontFamily` |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 | `spacing.*` |
| Card padding | ~20 | `layout.cardPadding` |
| Gutters | 16 mobile | `layout.screenHorizontalPadding` |
| Radii | 8 / 12 / 16 / 999 | `radii.*` |
| Touch target | 48dp | `layout.minTouchTarget` |
| Risk cards | Left colour bar + icon + title/subtitle | `RiskSummaryCard` |
| Offline banner | Slim strip, status wording | `ConnectivityBanner` |
| Elevation | Tonal / light elevation | `shadows.sm` / `md` |

## Repeated but previously undocumented

- Semantic text hierarchy beyond raw Stitch sizes (title, bodyStrong, riskLabel, numericHighlight)
- Sync wording set (“Saved on this device”, “Waiting for connection”, …)
- Pill status chips with glyph + label (non-colour cue)
- Dev-only component gallery (not in Stitch)

## Inconsistent between screens

| Topic | Observation | Stage 3 decision |
|---|---|---|
| Primary teal | Some Stitch Material variants use `#005C55` | **Freeze on `#0F766E`** (product-approved) |
| Danger red | Occasional `#BA1A1A` / `#DC2626` | **Freeze on `#B42318`** |
| Heading sizes | Overview lists 32/24/20; tokens JSON lists 32/26/20 | Use JSON display/h1 + overview weights; document hybrid in `DESIGN_TOKENS.md` |
| Splash drafts | Multiple static splash variants | Out of Stage 3 scope |

## Alternative / draft variants

- Static splash screens vs `splash_screen_animated` (final)
- Empty `client_profile` skeleton vs populated sample
- Stitch SVG logo candidates (not approved for runtime)

## Unsafe or inaccessible risks noted

- Colour-only status on some Stitch chips → components require glyph/text
- Placeholder-only labels must be avoided → `FormLabel` required
- Important text must not live inside images → logo/image wrappers enforce labels
- Heavy web box-shadows → Android light elevation only

## Missing from prior token seed

- Semantic colour aliases
- Full spacing scale (0–80)
- Layout semantics (touch target, card padding, nav clearance)
- Radius aliases (card/input/button/modal)
- Shadows, borders, opacity, motion
- Typography style tokens beyond family name

## Component pattern → Stage 3 mapping

| Stitch pattern | Stage 3 component |
|---|---|
| Body / headings | `AppText` |
| Primary / secondary CTAs | `AppButton` |
| Text fields | `AppTextInput`, `SearchInput` |
| Cards / action tiles | `AppCard`, `PressableCard` |
| Top app bar | `AppHeader`, `BackButton` |
| Filter / status pills | `StatusChip`, `CountBadge` |
| Risk result card | `RiskSummaryCard`, `RiskBadge`, `RiskIcon` |
| Offline strip / sync badge | `ConnectivityBanner`, `SyncStatusIndicator` |
| Empty / conflict states | `AppStateView` |
| Logo mark | `NorthCareLogo` |
