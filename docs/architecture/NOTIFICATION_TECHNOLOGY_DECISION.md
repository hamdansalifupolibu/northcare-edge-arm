# Notification technology decision

Stage 15 selects Expo SDK 57 `expo-notifications` for local follow-up notifications. It is the only notification package installed. The config plugin requires a rebuilt native application before Android runtime validation.

The local scheduler creates `northcare-follow-up-reminders` at Android `DEFAULT` importance. It requests no exact-alarm permission, critical-alert capability, sound override, full-screen intent, FCM token, APNs token, Expo push token, SMS, or remote delivery.

Each native notification uses the generic title “NorthCare follow-up reminder” and generic body “Open NorthCare AI to review a scheduled follow-up.” Its payload contains only schema version, reminder ID, and `openReminder` action. Client identity, facility, private note, health data, and native identifiers remain outside notification payloads.

The operating system may defer ordinary scheduled delivery. Battery optimisation, restart behaviour, and device clock changes require Android-device validation; a reminder is never treated as proof of care, delivery, or a completed visit. Native schedule metadata is device-local and excluded from synchronisation.
