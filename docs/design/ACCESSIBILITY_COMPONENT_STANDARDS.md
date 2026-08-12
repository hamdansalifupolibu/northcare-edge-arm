# Accessibility Component Standards

**Stage:** 3  
**Last reviewed:** 2026-08-02  

## Requirements for design-system components

1. **Touch targets** — interactive controls minimum ~48 logical pixels (`layout.minTouchTarget`)
2. **Labels** — every control exposes `accessibilityLabel` (or visible text that doubles as the label)
3. **Roles** — use `button`, `checkbox`, `search`, `header`, `alert`, `progressbar` appropriately
4. **State** — expose `disabled`, `busy`, `checked`, `selected` via `accessibilityState`
5. **Text scaling** — do not disable font scaling globally; `AppText` defaults `allowFontScaling` to true
6. **Contrast** — dark text on light canvas; inverse text on teal/primary actions
7. **Non-colour status** — chips, banners, and risk UI include glyph and/or text
8. **Focus order** — logical top-to-bottom reading; headers before content
9. **Reduced motion** — no fake loading animation; motion constants only; critical info never animation-only
10. **Errors** — `FormErrorText` uses alert / polite live region; do not rely on red borders alone
11. **Buttons** — clear verb labels; destructive actions must say so in words
12. **Forms** — never placeholder-only labels (`FormLabel` required on `AppTextInput`)
13. **Images** — no important UI text inside images; logos/images require labels unless decorative
14. **Translation length** — allow wrapping; avoid fixed-height text boxes that clip
15. **Loading** — announce loading; block double-submit while `loading`

## Verification in Stage 3

- Unit tests cover labels, risk wording, offline wording, error text, logo a11y
- Manual: open Design System Preview on Android and enlarge font settings when possible
