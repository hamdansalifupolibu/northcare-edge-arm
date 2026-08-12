# Notification privacy

Local notifications may appear on lock screens, trays, wearables, and screenshots.

## Required wording

- Title: `NorthCare follow-up reminder`
- Body: `Open NorthCare AI to review a scheduled follow-up.`

## Forbidden in title, body, subtitle, badge, category, or data payload

Client name/initials/code, phone, caregiver, community, facility, pregnancy/newborn/child category, screening answers, measurements, risk priority, referral reason, nutrition information, transcript, diagnosis, medication, follow-up reason, private notes.

## Allowed data payload

- `version`
- `reminderId`
- `action` (`openReminder`)

Resolve client and clinical context only after authentication and unlock, from the protected reminder record.
