export const REMINDER_TYPES = [
  'generalFollowUp',
  'visitFollowUp',
  'nutritionFollowUp',
  'referralFollowUp',
  'recordReview',
] as const;
export const REMINDER_SOURCES = [
  'workerCreated',
  'clientProfile',
  'visit',
  'nutritionAssessment',
  'referral',
  'approvedGuidance',
  'remoteAuthorisedReminder',
] as const;
export const REMINDER_STATUSES = [
  'draft',
  'active',
  'snoozed',
  'handled',
  'cancelled',
  'expired',
  'needsReview',
  'scheduleFailed',
] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ReminderSource = (typeof REMINDER_SOURCES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
export type NotificationPermissionState =
  | 'unknown'
  | 'notRequested'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'permanentlyDenied'
  | 'unavailable'
  | 'error';

export type FollowUpReminder = {
  readonly id: string;
  readonly accountId: string;
  readonly organisationId: string;
  readonly facilityId: string;
  readonly clientId: string | null;
  readonly encounterId: string | null;
  readonly sourceType: ReminderSource;
  readonly sourceEntityId: string | null;
  readonly reminderType: ReminderType;
  readonly status: ReminderStatus;
  readonly scheduledForUtc: string;
  readonly originalTimeZone: string;
  readonly originalLocalDate: string;
  readonly originalLocalTime: string;
  readonly note: string | null;
  readonly localVersion: number;
};

export const NOTIFICATION_TITLE = 'NorthCare follow-up reminder';
export const NOTIFICATION_BODY = 'Open NorthCare AI to review a scheduled follow-up.';

export function buildPrivateNotification(reminderId: string): {
  readonly title: string;
  readonly body: string;
  readonly data: { readonly version: 1; readonly reminderId: string; readonly action: 'openReminder' };
} {
  return {
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
    data: { version: 1, reminderId, action: 'openReminder' },
  };
}

export function workerScheduleToUtc(input: {
  readonly localDate: string;
  readonly localTime: string;
  readonly timeZone: string;
  readonly now?: Date;
}): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.localDate) || !/^\d{2}:\d{2}$/.test(input.localTime)) {
    throw new Error('A valid reviewed date and time are required.');
  }
  // Date parsing in the device timezone preserves the worker-selected local wall time.
  const value = new Date(`${input.localDate}T${input.localTime}:00`);
  if (Number.isNaN(value.getTime()) || value <= (input.now ?? new Date())) {
    throw new Error('The selected reminder time must be in the future.');
  }
  if (!input.timeZone.trim()) {
    throw new Error('A device time-zone identifier is required.');
  }
  return value.toISOString();
}

export function isSafeReminderResponse(value: unknown): value is {
  readonly version: 1;
  readonly reminderId: string;
  readonly action: 'openReminder';
} {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    data.version === 1 &&
    data.action === 'openReminder' &&
    typeof data.reminderId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      data.reminderId,
    )
  );
}
