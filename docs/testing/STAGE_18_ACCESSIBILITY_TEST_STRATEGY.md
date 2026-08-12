# Stage 18 — Accessibility Test Strategy

**Updated:** 2026-08-02

## Automated

- Shared component contracts: roles, labels, disabled/busy, error association, touch target min height, font scaling, reduced-motion render path
- Feature `a11yLabels` suites for voice/nutrition/assistant
- PasswordField show/hide labels

## Manual

- TalkBack sample path (documented honestly)
- Large text sampling
- Reduced motion OS setting

## Non-replacement rule

Automated tests **do not** replace TalkBack.
