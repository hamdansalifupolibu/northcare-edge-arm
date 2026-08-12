import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import type { CreateFollowUpReminderInput } from '../../../data/repositories/contracts/reminderTypes';
import {
  isSafeReminderResponse,
  workerScheduleToUtc,
  type FollowUpReminder,
  type ReminderStatus,
} from '../domain/reminderDomain';
import type { LocalNotificationScheduler } from '../scheduling/LocalNotificationScheduler';

function syncPayload(reminder: FollowUpReminder): Record<string, unknown> {
  return {
    id: reminder.id,
    accountId: reminder.accountId,
    organisationId: reminder.organisationId,
    facilityId: reminder.facilityId,
    clientId: reminder.clientId,
    encounterId: reminder.encounterId,
    sourceType: reminder.sourceType,
    sourceEntityId: reminder.sourceEntityId,
    reminderType: reminder.reminderType,
    status: reminder.status,
    scheduledForUtc: reminder.scheduledForUtc,
    originalTimeZone: reminder.originalTimeZone,
    originalLocalDate: reminder.originalLocalDate,
    originalLocalTime: reminder.originalLocalTime,
    note: reminder.note,
    localVersion: reminder.localVersion,
  };
}

const SCHEDULABLE: ReadonlySet<ReminderStatus> = new Set([
  'active',
  'snoozed',
  'scheduleFailed',
]);

const ACTIVE_REFERRAL_FOLLOW_UP: readonly ReminderStatus[] = [
  'active',
  'snoozed',
  'scheduleFailed',
];

export type ReminderServices = ReturnType<typeof createReminderServices>;

export function createReminderServices(
  repos: RepositoryContainer,
  scheduler: LocalNotificationScheduler,
) {
  async function findActiveReferralFollowUp(accountId: string, referralId: string) {
    const reminders = await repos.followUpReminders.listByAccount(
      accountId,
      ACTIVE_REFERRAL_FOLLOW_UP,
    );
    return (
      reminders.find(
        (reminder) =>
          reminder.reminderType === 'referralFollowUp' &&
          reminder.sourceEntityId === referralId,
      ) ?? null
    );
  }

  async function enqueue(
    reminder: FollowUpReminder,
    operation: 'create' | 'update' | 'delete',
  ) {
    await repos.syncQueue.enqueue({
      entityType: 'followUpReminder',
      entityId: reminder.id,
      operation,
      payloadVersion: reminder.localVersion,
      payloadJson: JSON.stringify(syncPayload(reminder)),
      clientLocalVersion: reminder.localVersion,
    });
  }

  async function cancelNative(reminderId: string) {
    const metadata = await repos.followUpReminders.getNativeScheduleMetadata(reminderId);
    if (metadata?.nativeNotificationId) {
      await scheduler.cancelReminder(metadata.nativeNotificationId);
    }
  }

  async function scheduleNative(reminder: FollowUpReminder) {
    const permission = await scheduler.getPermissionStatus();
    if (permission !== 'granted') {
      await repos.followUpReminders.updateNativeScheduleMetadata({
        reminderId: reminder.id,
        nativeScheduleState: 'unavailable',
      });
      return reminder;
    }
    try {
      await scheduler.ensureChannels();
      await cancelNative(reminder.id);
      const nativeNotificationId = await scheduler.scheduleReminder({
        reminderId: reminder.id,
        scheduledForUtc: reminder.scheduledForUtc,
      });
      await repos.followUpReminders.updateNativeScheduleMetadata({
        reminderId: reminder.id,
        nativeNotificationId,
        nativeScheduleState: 'scheduled',
      });
      if (reminder.status === 'scheduleFailed') {
        return repos.followUpReminders.updateStatus({ id: reminder.id, status: 'active' });
      }
      return reminder;
    } catch {
      await repos.followUpReminders.updateNativeScheduleMetadata({
        reminderId: reminder.id,
        nativeScheduleState: 'scheduleFailed',
        errorCategory: 'scheduleFailed',
      });
      return repos.followUpReminders.updateStatus({
        id: reminder.id,
        status: 'scheduleFailed',
      });
    }
  }

  return {
    listForCentre(accountId: string) {
      return repos.followUpReminders.listByAccount(accountId);
    },

    findById(id: string) {
      return repos.followUpReminders.findById(id);
    },

    /** Active/snoozed/scheduleFailed referral follow-up for the same referral (dedup). */
    findActiveReferralFollowUp,

    async create(
      input: CreateFollowUpReminderInput & { readonly requestPermission?: boolean },
    ) {
      if (input.reminderType === 'referralFollowUp' && input.sourceEntityId) {
        const existing = await findActiveReferralFollowUp(
          input.accountId,
          input.sourceEntityId,
        );
        if (existing) {
          throw new Error(
            'An active follow-up reminder already exists for this referral. Open that reminder instead of creating another.',
          );
        }
      }
      const scheduledForUtc = workerScheduleToUtc({
        localDate: input.originalLocalDate,
        localTime: input.originalLocalTime,
        timeZone: input.originalTimeZone,
      });
      let reminder = await repos.followUpReminders.create({
        ...input,
        scheduledForUtc,
        status: 'draft',
      });
      const permission = input.requestPermission
        ? await scheduler.requestPermission()
        : await scheduler.getPermissionStatus();
      await repos.notificationPreferences.save({
        accountId: input.accountId,
        permissionState: permission,
        channelState: permission === 'granted' ? 'available' : 'unavailable',
      });
      if (permission === 'granted') {
        reminder = await repos.followUpReminders.updateStatus({
          id: reminder.id,
          status: 'active',
        });
        reminder = await scheduleNative(reminder);
      } else {
        reminder = await repos.followUpReminders.updateStatus({
          id: reminder.id,
          status: 'active',
        });
        await repos.followUpReminders.updateNativeScheduleMetadata({
          reminderId: reminder.id,
          nativeScheduleState: 'unavailable',
        });
      }
      await repos.auditEvents.record({
        eventType: 'reminder_activated',
        entityType: 'follow_up_reminder',
        entityId: reminder.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: { status: reminder.status, permissionCategory: permission },
      });
      await enqueue(reminder, 'create');
      return reminder;
    },

    async snooze(input: {
      readonly id: string;
      readonly accountId: string;
      readonly localDate: string;
      readonly localTime: string;
      readonly timeZone: string;
    }) {
      const scheduledForUtc = workerScheduleToUtc({
        localDate: input.localDate,
        localTime: input.localTime,
        timeZone: input.timeZone,
      });
      await cancelNative(input.id);
      let reminder = await repos.followUpReminders.updateSchedule({
        id: input.id,
        scheduledForUtc,
        originalLocalDate: input.localDate,
        originalLocalTime: input.localTime,
        originalTimeZone: input.timeZone,
        status: 'snoozed',
      });
      reminder = await scheduleNative(reminder);
      await enqueue(reminder, 'update');
      await repos.auditEvents.record({
        eventType: 'reminder_snoozed',
        entityType: 'follow_up_reminder',
        entityId: input.id,
        actorAccountId: input.accountId,
        result: 'success',
      });
      return reminder;
    },

    async reschedule(input: {
      readonly id: string;
      readonly accountId: string;
      readonly localDate: string;
      readonly localTime: string;
      readonly timeZone: string;
    }) {
      const scheduledForUtc = workerScheduleToUtc({
        localDate: input.localDate,
        localTime: input.localTime,
        timeZone: input.timeZone,
      });
      await cancelNative(input.id);
      let reminder = await repos.followUpReminders.updateSchedule({
        id: input.id,
        scheduledForUtc,
        originalLocalDate: input.localDate,
        originalLocalTime: input.localTime,
        originalTimeZone: input.timeZone,
        status: 'active',
      });
      reminder = await scheduleNative(reminder);
      await enqueue(reminder, 'update');
      await repos.auditEvents.record({
        eventType: 'reminder_rescheduled',
        entityType: 'follow_up_reminder',
        entityId: input.id,
        actorAccountId: input.accountId,
        result: 'success',
      });
      return reminder;
    },

    async cancel(id: string, accountId: string) {
      await cancelNative(id);
      const reminder = await repos.followUpReminders.updateStatus({
        id,
        status: 'cancelled',
      });
      await enqueue(reminder, 'update');
      await repos.auditEvents.record({
        eventType: 'reminder_cancelled',
        entityType: 'follow_up_reminder',
        entityId: id,
        actorAccountId: accountId,
        result: 'success',
      });
      return reminder;
    },

    async markHandled(id: string, accountId: string) {
      await cancelNative(id);
      const reminder = await repos.followUpReminders.updateStatus({
        id,
        status: 'handled',
        handledByAccountId: accountId,
      });
      await enqueue(reminder, 'update');
      await repos.auditEvents.record({
        eventType: 'reminder_handled',
        entityType: 'follow_up_reminder',
        entityId: id,
        actorAccountId: accountId,
        result: 'success',
        metadata: { meaning: 'reminder_item_reviewed_not_care_completed' },
      });
      return reminder;
    },

    async reconcile(accountId: string) {
      const reminders = await repos.followUpReminders.listByAccount(accountId);
      const permission = await scheduler.getPermissionStatus();
      const scheduled = await scheduler.listScheduledNorthCareNotifications();
      const knownIds = new Set(
        reminders.filter((r) => SCHEDULABLE.has(r.status)).map((r) => r.id),
      );
      let scheduledCount = 0;
      let cancelledOrphans = 0;
      if (permission === 'granted') {
        for (const reminder of reminders) {
          if (!SCHEDULABLE.has(reminder.status)) continue;
          const existing = scheduled.find((item) => item.reminderId === reminder.id);
          if (!existing) {
            await scheduleNative(reminder);
            scheduledCount += 1;
          }
        }
      }
      for (const item of scheduled) {
        if (item.reminderId && !knownIds.has(item.reminderId)) {
          await scheduler.cancelReminder(item.identifier);
          cancelledOrphans += 1;
        }
      }
      await repos.auditEvents.record({
        eventType: 'reminder_reconciled',
        entityType: 'follow_up_reminder',
        actorAccountId: accountId,
        result: 'success',
        metadata: { scheduledCount, cancelledOrphans, permissionCategory: permission },
      });
      return { scheduledCount, cancelledOrphans, permission };
    },

    async resolveNotificationTap(input: {
      readonly payload: unknown;
      readonly accountId: string;
      readonly facilityId: string;
      readonly role: string;
      readonly isUnlocked: boolean;
      readonly isAuthenticated: boolean;
    }): Promise<
      | { readonly ok: true; readonly reminderId: string }
      | { readonly ok: false; readonly reason: string }
    > {
      if (!input.isAuthenticated) return { ok: false, reason: 'signedOut' };
      if (!input.isUnlocked) return { ok: false, reason: 'locked' };
      if (input.role !== 'worker') return { ok: false, reason: 'roleDenied' };
      if (!isSafeReminderResponse(input.payload)) {
        return { ok: false, reason: 'invalidPayload' };
      }
      const reminder = await repos.followUpReminders.findById(input.payload.reminderId);
      if (!reminder || reminder.accountId !== input.accountId) {
        return { ok: false, reason: 'missing' };
      }
      if (reminder.facilityId !== input.facilityId) {
        return { ok: false, reason: 'facilityScope' };
      }
      await repos.auditEvents.record({
        eventType: 'reminder_opened',
        entityType: 'follow_up_reminder',
        entityId: reminder.id,
        actorAccountId: input.accountId,
        result: 'success',
      });
      return { ok: true, reminderId: reminder.id };
    },
  };
}
