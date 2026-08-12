# Stage 18 — Accessibility Audit

**Updated:** 2026-08-02  
**Method:** Component inventory review + automated a11y contract tests + Android TalkBack attempt (see TalkBack doc)  
**Claim level:** Engineering audit — **not WCAG certification**

## Method

1. Enumerate production routes from `implementation/screen-inventory.json` and `implementation/route-map.json`.
2. Review shared design-system components for role/label/state/hit-target/live-region patterns.
3. Run automated tests (`stage18AccessibilityComponents.test.tsx`, feature `a11yLabels` suites, PasswordField tests).
4. Attempt TalkBack on emulator/device and record evidence honestly.
5. Review contrast tokens, text scaling (`allowFontScaling`), focus/modals, reduced motion.

## Screen coverage summary

| Area | Audit status | Notes |
|---|---|---|
| Entry / onboarding / splash | Reviewed | Reduced motion; brand labels |
| Auth login / unlock / password change | Reviewed | PasswordField show/hide labels; live region errors |
| Workspace selection | Reviewed | Cards labelled; motion gated |
| Worker home / clients / visits / screening | Reviewed (code + tests) | Forms use AppTextInput error association |
| Risk / referrals / QR | Reviewed | Status not colour-only (RiskBadge/StatusChip prefixes) |
| Voice / nutrition / Ask NorthCare | Reviewed | Existing a11yLabels tests |
| Reminders / notifications | Reviewed | ReminderListItem labels; generic notification copy |
| Administration | Reviewed | AccountListItem combined labels |
| Development preview routes | Production-blocked | Not a production a11y target |

## Automated evidence

- `apps/mobile/src/__tests__/stage18AccessibilityComponents.test.tsx` (9 tests)
- Feature a11y label suites (assistant/nutrition/voice)
- PasswordField / design-system component tests

## Gaps (honest)

- Full TalkBack pass on every screen: **not completed** — sample path attempted/documented
- Physical-device font scale 200% on all screens: sample / partial
- Material Symbols font bundling still outstanding (visual, not a11y semantics)

## Non-claims

No WCAG 2.1/2.2 A/AA/AAA conformance certificate is claimed.
