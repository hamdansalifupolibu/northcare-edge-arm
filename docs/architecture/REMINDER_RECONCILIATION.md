# Reminder reconciliation

SQLite and the OS scheduler are not one transaction. After create/update and on unlock/foreground/sync/permission change, reconcile:

1. Load active/snoozed/scheduleFailed reminders
2. List NorthCare scheduled notifications
3. Schedule missing eligible reminders when permission is granted
4. Cancel orphaned NorthCare reminder notifications
5. Preserve in-app reminders when permission is denied
