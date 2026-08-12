# Stage 18 — Focus Management

**Updated:** 2026-08-02

## Expectations

- Logical focus order follows visual reading order on forms
- Modal/dialog primary actions are reachable with accessibility focus
- Route changes should not leave focus trapped in unmounted trees
- Password visibility toggle is a separate accessible control

## Review notes

- `AppTextInput` exposes labelled fields with error hints for assistive tech
- `PasswordField` resets visibility on blur/unmount (privacy + predictable state)
- Workspace cards and list items expose button roles with descriptive labels

## Residual

- Full TalkBack focus-order recording per screen incomplete — retest in Stage 19
- Native modal focus restore after development build install still needs device confirmation
