# NorthCare Reach — Worker UI (R4)

**Last updated:** 2026-08-03  

## Screens

1. **Community Requests Centre** — filters, list, refresh, offline/error/empty states  
2. **Community Request Detail** — authorised contact, consent, status, actions  

## Entry

Worker home action **Community Requests** with subtitle:

> Review requests submitted through NorthCare Reach.

No claims of real-time delivery, telecom connection, live dispatch, or push.

## Filters (exact R2)

- Awaiting review (`awaiting`)
- Assigned to me (`assignedToMe`)
- Emergency (`emergency`)
- Handled (`handled`)

## Emergency presentation (R4 + R5)

Clear text label **Emergency assistance request**, icon glyph, semantic border/chip. Filter notice and detail banner state simulation + live integration pending. No flashing, sounds, or fake live alerts.

## Actions

| Action | Confirmation |
|---|---|
| Acknowledge request | Responsibility wording (not “case accepted”) |
| Escalate for further human support | Needs further support; **will not** contact/dispatch ambulance |
| Record contact attempt | Attempt recorded (not contact success) |
| Mark request handled | Explains not clinical care / emergency outcome |
| Start client lookup | Navigates to clients; no auto-link |

Call dialler omitted for simplicity; contact number is shown on detail.

See also `docs/design/NORTHCARE_REACH_EMERGENCY_UI.md` (R5).
