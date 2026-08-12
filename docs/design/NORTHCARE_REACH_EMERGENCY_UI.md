# NorthCare Reach — Emergency UI (R5)

**Last updated:** 2026-08-03  

## Principles

- Calm, usable presentation — not a full-screen warning on every entry
- Text + icon + semantic border/badge — never colour-only
- No flashing, pulsing, sirens, countdown, haptic alarm loops
- Separate from clinical RED / AMBER / GREEN priority wording

## Emergency filter

When the Emergency filter is selected:

- Heading: **Emergency assistance requests**
- Explanation: submitted through NorthCare Reach emergency simulation
- Live emergency-service integration is not active

## Emergency card

- Label: Emergency assistance request
- Icon glyph (not the sole indicator)
- Semantic left border / badge using approved urgent tokens
- Landmark, submitted time, status text+chip, assigned-to-me

Forbidden wording includes ambulance dispatch claims and medical severity labels.

## Detail banner (emergency only)

**Emergency coordination simulation**

If someone is in immediate danger, the requester should call 112.

Live emergency-service integration is pending.

Does not imply NorthCare placed a call.

## Escalation

- Action: Escalate for further human support
- Visible only when R2 UI helpers allow (`acknowledged` + assigned to caller)
- Confirmation states the action will **not** contact or dispatch an ambulance
- Success: Request escalated for further support
