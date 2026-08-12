import type { NotificationPermissionState } from '../domain/reminderDomain';
import type {
  LocalNotificationScheduler,
  ScheduledNorthCareNotification,
} from './LocalNotificationScheduler';

export class FakeLocalNotificationScheduler implements LocalNotificationScheduler {
  permission: NotificationPermissionState = 'notRequested';
  readonly scheduled = new Map<string, ScheduledNorthCareNotification>();
  failScheduling = false;
  async getPermissionStatus() { return this.permission; }
  async requestPermission() { return this.permission = this.permission === 'notRequested' ? 'granted' : this.permission; }
  async ensureChannels() {}
  async scheduleReminder(input: { reminderId: string; scheduledForUtc: string }) {
    if (this.failScheduling) throw new Error('scheduleFailed');
    const identifier = `fake-${input.reminderId}`;
    this.scheduled.set(identifier, { identifier, reminderId: input.reminderId });
    return identifier;
  }
  async cancelReminder(nativeNotificationId: string) { this.scheduled.delete(nativeNotificationId); }
  async listScheduledNorthCareNotifications() { return [...this.scheduled.values()]; }
  async openSettings() {}
}
