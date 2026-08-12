import { useReminderNotificationShell } from '../navigation/useReminderNotificationShell';

/** Mount once under the authenticated app tree for local notification response + reconcile. */
export function ReminderNotificationBridge() {
  useReminderNotificationShell();
  return null;
}
