# STAGE 15 — Notifications and Follow-up Reminders

**Status:** Implementation complete — awaiting validation approval  
**Prerequisites:** Stage 14 validated  
**Next stage:** Stage 16 — Administration and Account Provisioning (do not start until approved)  
**Checkpoint:** `docs/development/STAGE_15_CHECKPOINT.md`

## Included

- Secure development worker provisioning (Argon2id, getpass CLI)
- Offline-first follow-up reminders (SQLite v9)
- Local notifications via `expo-notifications` only
- Reminder Centre + create/details/snooze/reschedule/cancel/handled
- Explicit entry points from client / visit / nutrition / referral
- Privacy-safe generic notification content
- Sync entity `follow_up_reminder` + device-local field exclusion
- Reconciliation and fail-closed notification tap handling

## Excluded

Remote push, FCM/APNs/Expo push tokens, SMS/email/WhatsApp, exact alarms, critical alerts, automatic clinical reminders, caregiver/client notifications, admin account screens, background-sync guarantees, AUTH-UX-01 password show/hide, Stage 16 administration.
