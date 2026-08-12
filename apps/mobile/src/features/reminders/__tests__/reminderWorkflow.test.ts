import { createReminderServices } from '../application/createReminderServices';
import { FakeLocalNotificationScheduler } from '../scheduling/FakeLocalNotificationScheduler';
import {
  NOTIFICATION_BODY,
  NOTIFICATION_TITLE,
  buildPrivateNotification,
} from '../domain/reminderDomain';

function createRepos(overrides?: {
  readonly failSchedule?: boolean;
  readonly permission?: 'granted' | 'denied' | 'notRequested';
}) {
  const rows = new Map<string, Record<string, unknown>>();
  const scheduleMeta = new Map<string, { nativeNotificationId: string | null; nativeScheduleState: string }>();
  const queue: unknown[] = [];
  const audits: unknown[] = [];
  const scheduler = new FakeLocalNotificationScheduler();
  scheduler.permission = overrides?.permission ?? 'granted';
  scheduler.failScheduling = overrides?.failSchedule ?? false;

  const repos = {
    followUpReminders: {
      async create(input: Record<string, unknown>) {
        const id = String(input.id ?? '00000000-0000-4000-8000-000000000099');
        const row = { ...input, id, localVersion: 1, status: input.status ?? 'draft' };
        rows.set(id, row);
        return row;
      },
      async findById(id: string) {
        return rows.get(id) ?? null;
      },
      async listByAccount(accountId: string) {
        return [...rows.values()].filter((row) => row.accountId === accountId);
      },
      async updateSchedule(input: Record<string, unknown>) {
        const current = rows.get(String(input.id));
        if (!current) throw new Error('missing');
        const next = { ...current, ...input, localVersion: Number(current.localVersion) + 1 };
        rows.set(String(input.id), next);
        return next;
      },
      async updateStatus(input: Record<string, unknown>) {
        const current = rows.get(String(input.id));
        if (!current) throw new Error('missing');
        const next = { ...current, status: input.status, localVersion: Number(current.localVersion) + 1 };
        rows.set(String(input.id), next);
        return next;
      },
      async updateNativeScheduleMetadata(input: {
        reminderId: string;
        nativeNotificationId?: string | null;
        nativeScheduleState: string;
      }) {
        scheduleMeta.set(input.reminderId, {
          nativeNotificationId: input.nativeNotificationId ?? null,
          nativeScheduleState: input.nativeScheduleState,
        });
      },
      async getNativeScheduleMetadata(reminderId: string) {
        return scheduleMeta.get(reminderId) ?? null;
      },
    },
    notificationPreferences: {
      async get() {
        return null;
      },
      async save() {},
    },
    syncQueue: {
      async enqueue(item: {
        entityId: string;
        operation: string;
        payloadJson?: string;
      }) {
        const existingIndex = queue.findIndex(
          (entry) =>
            (entry as { entityId: string; operation: string }).entityId === item.entityId &&
            (entry as { entityId: string; operation: string }).operation === item.operation,
        );
        if (existingIndex >= 0) {
          queue[existingIndex] = { ...queue[existingIndex], ...item };
          return queue[existingIndex];
        }
        queue.push(item);
        return item;
      },
    },
    auditEvents: {
      async record(event: unknown) {
        audits.push(event);
        return event;
      },
    },
  };

  return {
    services: createReminderServices(repos as never, scheduler),
    scheduler,
    queue,
    audits,
    rows,
  };
}

const baseInput = {
  accountId: 'dev-worker-001',
  organisationId: 'org-dev-001',
  facilityId: 'fac-dev-001',
  clientId: 'client-1',
  encounterId: null,
  sourceType: 'workerCreated' as const,
  sourceEntityId: null,
  reminderType: 'generalFollowUp' as const,
  scheduledForUtc: '2099-01-01T09:00:00.000Z',
  originalTimeZone: 'Africa/Accra',
  originalLocalDate: '2099-01-01',
  originalLocalTime: '09:00',
  note: 'private device note',
};

describe('reminder workflow and scheduling', () => {
  it('saves in-app when permission is denied and still enqueues sync without native ids', async () => {
    const { services, queue, scheduler } = createRepos({ permission: 'denied' });
    const reminder = await services.create({ ...baseInput, requestPermission: true });
    expect(reminder.status).toBe('active');
    expect(scheduler.scheduled.size).toBe(0);
    const payload = JSON.parse(String((queue[0] as { payloadJson: string }).payloadJson));
    expect(payload.nativeNotificationId).toBeUndefined();
    expect(payload.note).toBe('private device note');
  });

  it('markHandled after snooze keeps one pending update with handled status', async () => {
    const { services, queue } = createRepos({ permission: 'granted' });
    const reminder = await services.create({ ...baseInput, requestPermission: true });
    await services.snooze({
      id: reminder.id,
      accountId: 'dev-worker-001',
      localDate: '2099-02-01',
      localTime: '10:00',
      timeZone: 'Africa/Accra',
    });
    await services.markHandled(reminder.id, 'dev-worker-001');
    const updates = queue.filter(
      (entry) => (entry as { operation: string }).operation === 'update',
    );
    expect(updates).toHaveLength(1);
    const payload = JSON.parse(String((updates[0] as { payloadJson: string }).payloadJson));
    expect(payload.status).toBe('handled');
  });

  it('schedules once, cancels on handle, and does not reschedule handled reminders', async () => {
    const { services, scheduler } = createRepos({ permission: 'granted' });
    const reminder = await services.create({ ...baseInput, requestPermission: true });
    expect(scheduler.scheduled.size).toBe(1);
    await services.markHandled(reminder.id, 'dev-worker-001');
    expect(scheduler.scheduled.size).toBe(0);
    const result = await services.reconcile('dev-worker-001');
    expect(result.scheduledCount).toBe(0);
  });

  it('keeps reminder when native scheduling fails', async () => {
    const { services } = createRepos({ permission: 'granted', failSchedule: true });
    const reminder = await services.create({ ...baseInput, requestPermission: true });
    expect(reminder.status).toBe('scheduleFailed');
  });

  it('fails closed for unsafe notification taps and opens valid ones when unlocked', async () => {
    const { services } = createRepos({ permission: 'granted' });
    const reminder = await services.create({ ...baseInput, requestPermission: false });
    const payload = buildPrivateNotification(reminder.id).data;
    const denied = await services.resolveNotificationTap({
      payload,
      accountId: 'dev-worker-001',
      facilityId: 'fac-dev-001',
      role: 'administrator',
      isUnlocked: true,
      isAuthenticated: true,
    });
    expect(denied.ok).toBe(false);
    const locked = await services.resolveNotificationTap({
      payload,
      accountId: 'dev-worker-001',
      facilityId: 'fac-dev-001',
      role: 'worker',
      isUnlocked: false,
      isAuthenticated: true,
    });
    expect(locked).toEqual({ ok: false, reason: 'locked' });
    const opened = await services.resolveNotificationTap({
      payload,
      accountId: 'dev-worker-001',
      facilityId: 'fac-dev-001',
      role: 'worker',
      isUnlocked: true,
      isAuthenticated: true,
    });
    expect(opened).toEqual({ ok: true, reminderId: reminder.id });
  });

  it('uses only generic notification content', () => {
    const content = buildPrivateNotification('00000000-0000-4000-8000-000000000001');
    expect(content.title).toBe(NOTIFICATION_TITLE);
    expect(content.body).toBe(NOTIFICATION_BODY);
    expect(JSON.stringify(content)).not.toContain('private');
    expect(JSON.stringify(content)).not.toContain('client-1');
  });

  it('rejects a second active referralFollowUp for the same referral', async () => {
    const { services } = createRepos({ permission: 'granted' });
    const referralId = 'ref-dup-001';
    const first = await services.create({
      ...baseInput,
      reminderType: 'referralFollowUp',
      sourceType: 'referral',
      sourceEntityId: referralId,
      requestPermission: true,
    });
    expect(first.status).toBe('active');
    await expect(
      services.create({
        ...baseInput,
        id: '00000000-0000-4000-8000-000000000098',
        reminderType: 'referralFollowUp',
        sourceType: 'referral',
        sourceEntityId: referralId,
        requestPermission: false,
      }),
    ).rejects.toThrow(/already exists/);
    const found = await services.findActiveReferralFollowUp('dev-worker-001', referralId);
    expect(found?.id).toBe(first.id);
  });
});
