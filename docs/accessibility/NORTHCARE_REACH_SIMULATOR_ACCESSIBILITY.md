# NorthCare Reach — Simulator Accessibility (R3)

**Status:** Implemented with Reach Stage R3  
**Last updated:** 2026-08-03

## Requirements met

- Visible labels for the numeric response field
- Proper buttons (Send, Back, Restart session)
- Keyboard support (Enter submits)
- Logical focus order and visible focus indicators
- Screen-reader labels and polite live region for menu/result changes
- Errors associated with the input (`role="alert"`)
- Adequate contrast on brand chrome and USSD area
- Large-text friendly clamp sizes
- `prefers-reduced-motion` respected
- Skip link to USSD input
- Minimum 48px touch targets on controls

## PIN announcement

Live region announces that a PIN is shown on screen and should be saved privately. Digits are not re-announced repeatedly.
