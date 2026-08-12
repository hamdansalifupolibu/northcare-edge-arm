# Reminder native scheduling

`LocalNotificationScheduler` wraps `expo-notifications`.

- Channel id: `northcare-follow-up-reminders`
- Importance: DEFAULT
- No `SCHEDULE_EXACT_ALARM`, critical alerts, or full-screen intents
- Permission requested only when creating/enabling the first reminder after in-app rationale
- Native IDs are device-local; each device schedules independently after pull
