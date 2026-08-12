# Remote notification boundary

Stage 15 implements **local notifications only**.

`RemoteNotificationProvider` returns `unavailable` and must not request Expo push tokens, FCM tokens, or APNs tokens. No server-side push delivery, SMS, email, or WhatsApp exists in this stage.

Background sync is not enabled and must not be claimed as a delivery guarantee for reminders.
