import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import {
  buildPrivateNotification,
  type NotificationPermissionState,
} from '../domain/reminderDomain';
import {
  FOLLOW_UP_CHANNEL_ID,
  type LocalNotificationScheduler,
  type ScheduledNorthCareNotification,
} from './LocalNotificationScheduler';

function mapPermission(status: Notifications.PermissionStatus): NotificationPermissionState {
  return status === Notifications.PermissionStatus.GRANTED ? 'granted' : 'denied';
}

/**
 * Native / development-build scheduler. Do not import this module from Expo Go
 * entry paths — `expo-notifications` throws on import in Expo Go (SDK 53+).
 */
export class ExpoLocalNotificationSchedulerImpl implements LocalNotificationScheduler {
  async getPermissionStatus(): Promise<NotificationPermissionState> {
    const permission = await Notifications.getPermissionsAsync();
    return mapPermission(permission.status);
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    const permission = await Notifications.requestPermissionsAsync();
    return mapPermission(permission.status);
  }

  async ensureChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync(FOLLOW_UP_CHANNEL_ID, {
      name: 'Follow-up reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: undefined,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }

  async scheduleReminder(input: {
    readonly reminderId: string;
    readonly scheduledForUtc: string;
  }): Promise<string> {
    const trigger = new Date(input.scheduledForUtc);
    if (Number.isNaN(trigger.getTime()) || trigger <= new Date()) {
      throw new Error('Reminder schedule must be a future time.');
    }
    const content = buildPrivateNotification(input.reminderId);
    return Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: FOLLOW_UP_CHANNEL_ID,
      },
    });
  }

  async cancelReminder(nativeNotificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(nativeNotificationId);
  }

  async listScheduledNorthCareNotifications(): Promise<readonly ScheduledNorthCareNotification[]> {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all
      .filter((notification) => {
        const data = notification.content.data;
        return data && typeof data.reminderId === 'string' && data.action === 'openReminder';
      })
      .map((notification) => ({
        identifier: notification.identifier,
        reminderId:
          typeof notification.content.data?.reminderId === 'string'
            ? notification.content.data.reminderId
            : null,
      }));
  }

  async openSettings(): Promise<void> {
    await Linking.openSettings();
  }
}
