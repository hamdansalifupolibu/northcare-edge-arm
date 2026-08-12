# Design Tokens

**Stage:** 3  
**Product:** NorthCare AI  
**Last reviewed:** 2026-08-02  

## Authoritative source

| Layer | Path | Role |
|---|---|---|
| **Runtime (authoritative)** | `apps/mobile/src/theme/` | TypeScript tokens used by components |
| Manifest (aligned) | `implementation/design-tokens.json` | Machine-readable snapshot for docs/tooling |
| Stitch reference | Stitch `03_DESIGN_TOKENS.json` + design overview | Visual / design authority |

Consistency check: `apps/mobile/src/__tests__/theme.tokens.test.ts` asserts approved values.

Do **not** maintain a second conflicting colour map in feature code. Prefer `semanticColors` over raw palette names.

## Colour

Approved brand values (hex) are frozen for Stage 3:

- Primary `#0F766E`, dark `#115E59`, darker `#064E49`
- Accent `#F59E0B`, accent light `#FEF3C7`
- Background `#F7FAF9`, surface `#FFFFFF`, muted `#EEF5F3`
- Text `#17211F` / `#52615E`, inverse `#FFFFFF`
- Border `#DDE7E4`
- Status: urgent `#B42318`, warning `#B54708`, stable `#067647`, info `#1570EF`

Semantic aliases live under `semanticColors` (`background.*`, `surface.*`, `text.*`, `action.*`, `status.*`).

## Typography

- **Family:** Plus Jakarta Sans (Stitch)
- **Loading:** `@expo-google-fonts/plus-jakarta-sans` + `expo-font`
- **Fallback:** Android `sans-serif` if load fails (app still starts)
- **Scaling:** `allowFontScaling` remains enabled on `AppText`

Semantic styles: `displayLarge`, `headingLarge|Medium|Small`, `title`, `bodyLarge`, `body`, `bodyStrong`, `caption`, `label`, `button`, `riskLabel`, `numericHighlight`.

## Spacing and layout

Stitch scale: 4 / 8 / 12 / 16 / 24 / 32, extended with 0, 2, 20, 40, 48, 64, 80.

Layout semantics include 16px screen padding, 20px card padding, 48dp min touch target, bottom-nav clearance 72.

## Radius, border, shadow

Radii: 8 / 12 / 16 / pill 999 + card/input/button/modal aliases.  
Borders: hairline / 1 / 2 / 3.  
Shadows: light Android elevation (`sm`/`md`) — tonal preference over heavy drop shadows.

## Motion

Constants only (`motion.duration.*`, `motion.easing.*`). No animation library added for constants. Reduced-motion principles documented in `motion.ts` and accessibility standards.
