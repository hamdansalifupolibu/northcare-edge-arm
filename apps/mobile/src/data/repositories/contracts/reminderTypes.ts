import type { FollowUpReminder, ReminderSource, ReminderStatus, ReminderType } from '../../../features/reminders/domain/reminderDomain';

export type CreateFollowUpReminderInput = Omit<
  FollowUpReminder,
  'id' | 'status' | 'localVersion'
> & {
  readonly id?: string;
  readonly status?: ReminderStatus;
};

export type FollowUpReminderRepository = {
  create(input: CreateFollowUpReminderInput): Promise<FollowUpReminder>;
  findById(id: string): Promise<FollowUpReminder | null>;
  listByAccount(accountId: string, statuses?: readonly ReminderStatus[]): Promise<FollowUpReminder[]>;
  updateSchedule(input: {
    readonly id: string;
    readonly scheduledForUtc: string;
    readonly originalLocalDate: string;
    readonly originalLocalTime: string;
    readonly originalTimeZone: string;
    readonly status: 'active' | 'snoozed';
  }): Promise<FollowUpReminder>;
  updateStatus(input: {
    readonly id: string;
    readonly status: ReminderStatus;
    readonly handledByAccountId?: string | null;
  }): Promise<FollowUpReminder>;
  updateNativeScheduleMetadata(input: {
    readonly reminderId: string;
    readonly nativeNotificationId?: string | null;
    readonly nativeScheduleState: string;
    readonly errorCategory?: string | null;
  }): Promise<void>;
  getNativeScheduleMetadata(reminderId: string): Promise<{
    readonly nativeNotificationId: string | null;
    readonly nativeScheduleState: string;
  } | null>;
};

export type NotificationPreferencesRepository = {
  get(accountId: string): Promise<{ readonly permissionState: string; readonly channelState: string } | null>;
  save(input: { readonly accountId: string; readonly permissionState: string; readonly channelState: string }): Promise<void>;
};

export type { FollowUpReminder, ReminderSource, ReminderStatus, ReminderType };
