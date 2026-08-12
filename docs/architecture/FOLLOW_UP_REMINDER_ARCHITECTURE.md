# Follow-up reminder architecture

Stage 15 delivers offline-first worker follow-up reminders with local device notifications.

## Layers

- Domain: `apps/mobile/src/features/reminders/domain/`
- Application services: `createReminderServices` (validate, persist, schedule, audit, sync enqueue)
- Repository: `FollowUpReminderRepository` + `notification_schedule_events` / `notification_preferences`
- Scheduler boundary: `LocalNotificationScheduler` (Expo implementation / fake / unavailable)
- Remote push boundary: `RemoteNotificationProvider` always unavailable
- UI: Reminder Centre and create/details screens under `/(worker)/more/reminders`

Screens never call `expo-notifications` or SQLite directly.

## Safety

- Worker-selected date and time only (or confirmed existing date + required time)
- Fixed suggested default (+7 local calendar days at 09:00) may prefill Create Reminder from referral CTAs; worker must confirm before save — never silent auto-create from `confirmReferral`
- No automatic reminders from RED/AMBER/GREEN, referrals, nutrition packs, or unconfirmed voice
- Handled ≠ care completed
- Notification title/body are generic; payload is version + reminderId + action only
- Native notification identifiers are device-local and excluded from sync
- App shell: notification response listener → `resolveNotificationTap` → Reminder details; `reconcile(accountId)` when worker session ready

## Sync

Entity type `followUpReminder` / `follow_up_reminder` uses Stage 14 protocol with `versionedRecord` conflict class. Competing schedule/status changes require review.
