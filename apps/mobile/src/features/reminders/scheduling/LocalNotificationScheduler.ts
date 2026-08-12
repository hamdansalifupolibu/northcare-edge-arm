import Constants from 'expo-constants';

import type { NotificationPermissionState } from '../domain/reminderDomain';

export const FOLLOW_UP_CHANNEL_ID = 'northcare-follow-up-reminders';

export type ScheduledNorthCareNotification = {
  readonly identifier: string;
  readonly reminderId: string | null;
};

export interface LocalNotificationScheduler {
  getPermissionStatus(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  ensureChannels(): Promise<void>;
  scheduleReminder(input: { readonly reminderId: string; readonly scheduledForUtc: string }): Promise<string>;
  cancelReminder(nativeNotificationId: string): Promise<void>;
  listScheduledNorthCareNotifications(): Promise<readonly ScheduledNorthCareNotification[]>;
  openSettings(): Promise<void>;
}

export class UnavailableLocalNotificationScheduler implements LocalNotificationScheduler {
  async getPermissionStatus(): Promise<NotificationPermissionState> {
    return 'unavailable';
  }
  async requestPermission(): Promise<NotificationPermissionState> {
    return 'unavailable';
  }
  async ensureChannels(): Promise<void> {
    throw new Error('Local notifications are unavailable.');
  }
  async scheduleReminder(): Promise<string> {
    throw new Error('Local notifications are unavailable.');
  }
  async cancelReminder(): Promise<void> {}
  async listScheduledNorthCareNotifications(): Promise<readonly ScheduledNorthCareNotification[]> {
    return [];
  }
  async openSettings(): Promise<void> {}
}

/**
 * Expo Go (SDK 53+) removes Android remote-notification support and throws when
 * `expo-notifications` is imported. Prefer a development build for native scheduling.
 */
export function isExpoGoNotificationRuntime(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Returns a working scheduler on development builds; fail-closed unavailable in Expo Go
 * or when the native module cannot load. Reminder records remain available in-app.
 */
export function createLocalNotificationScheduler(): LocalNotificationScheduler {
  if (isExpoGoNotificationRuntime()) {
    return new UnavailableLocalNotificationScheduler();
  }
  try {
    // Lazy require avoids evaluating expo-notifications during Expo Go module graph load.
    const mod = loadNativeNotificationSchedulerModule();
    return new mod.ExpoLocalNotificationSchedulerImpl();
  } catch {
    return new UnavailableLocalNotificationScheduler();
  }
}

function loadNativeNotificationSchedulerModule(): typeof import('./ExpoLocalNotificationSchedulerImpl') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must stay lazy for Expo Go
  return require('./ExpoLocalNotificationSchedulerImpl');
}
