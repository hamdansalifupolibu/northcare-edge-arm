import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  FollowUpReminder,
  FollowUpReminderRepository,
  NotificationPreferencesRepository,
  ReminderStatus,
} from '../contracts/reminderTypes';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { Clock } from '../../domain/value-objects/clock';

type Row = {
  id: string; account_id: string; organisation_id: string; facility_id: string; client_id: string | null;
  encounter_id: string | null; source_type: FollowUpReminder['sourceType']; source_entity_id: string | null;
  reminder_type: FollowUpReminder['reminderType']; status: ReminderStatus; scheduled_for_utc: string;
  original_time_zone: string; original_local_date: string; original_local_time: string; note: string | null;
  local_version: number;
};

function map(row: Row): FollowUpReminder {
  return {
    id: row.id, accountId: row.account_id, organisationId: row.organisation_id, facilityId: row.facility_id,
    clientId: row.client_id, encounterId: row.encounter_id, sourceType: row.source_type,
    sourceEntityId: row.source_entity_id, reminderType: row.reminder_type, status: row.status,
    scheduledForUtc: row.scheduled_for_utc, originalTimeZone: row.original_time_zone,
    originalLocalDate: row.original_local_date, originalLocalTime: row.original_local_time,
    note: row.note, localVersion: row.local_version,
  };
}

export function createSqliteFollowUpReminderRepository(
  db: SqliteDriver, ids: IdGenerator, clock: Clock,
): FollowUpReminderRepository {
  const select = `SELECT id, account_id, organisation_id, facility_id, client_id, encounter_id,
    source_type, source_entity_id, reminder_type, status, scheduled_for_utc, original_time_zone,
    original_local_date, original_local_time, note, local_version FROM follow_up_reminders`;
  return {
    async create(input) {
      const id = input.id ?? ids.nextId();
      const now = clock.nowIso();
      await db.runAsync(
        `INSERT INTO follow_up_reminders (id,account_id,organisation_id,facility_id,client_id,encounter_id,
         source_type,source_entity_id,reminder_type,status,scheduled_for_utc,original_time_zone,
         original_local_date,original_local_time,note,created_by_account_id,created_at,updated_at,local_version,sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'pending')`,
        [id,input.accountId,input.organisationId,input.facilityId,input.clientId,input.encounterId,input.sourceType,
          input.sourceEntityId,input.reminderType,input.status ?? 'draft',input.scheduledForUtc,input.originalTimeZone,
          input.originalLocalDate,input.originalLocalTime,input.note,input.accountId,now,now],
      );
      const created = await this.findById(id);
      if (!created) throw new Error('Reminder creation did not persist.');
      return created;
    },
    async findById(id) {
      const row = await db.getFirstAsync<Row>(`${select} WHERE id = ? AND is_deleted = 0`, [id]);
      return row ? map(row) : null;
    },
    async listByAccount(accountId, statuses) {
      const filter = statuses?.length ? ` AND status IN (${statuses.map(() => '?').join(',')})` : '';
      const rows = await db.getAllAsync<Row>(
        `${select} WHERE account_id = ? AND is_deleted = 0${filter} ORDER BY scheduled_for_utc ASC`,
        [accountId, ...(statuses ?? [])],
      );
      return rows.map(map);
    },
    async updateSchedule(input) {
      const now = clock.nowIso();
      await db.runAsync(
        `UPDATE follow_up_reminders SET scheduled_for_utc=?,original_local_date=?,original_local_time=?,
         original_time_zone=?,status=?,snoozed_from_utc=CASE WHEN ?='snoozed' THEN scheduled_for_utc ELSE snoozed_from_utc END,
         updated_at=?,local_version=local_version+1,sync_status='pending' WHERE id=?`,
        [input.scheduledForUtc,input.originalLocalDate,input.originalLocalTime,input.originalTimeZone,input.status,input.status,now,input.id],
      );
      const updated = await this.findById(input.id);
      if (!updated) throw new Error('Reminder was not found.');
      return updated;
    },
    async updateStatus(input) {
      const now = clock.nowIso();
      await db.runAsync(
        `UPDATE follow_up_reminders SET status=?,handled_by_account_id=?,handled_at=CASE WHEN ?='handled' THEN ? ELSE handled_at END,
         cancelled_at=CASE WHEN ?='cancelled' THEN ? ELSE cancelled_at END,updated_at=?,local_version=local_version+1,sync_status='pending' WHERE id=?`,
        [input.status,input.handledByAccountId ?? null,input.status,now,input.status,now,now,input.id],
      );
      const updated = await this.findById(input.id);
      if (!updated) throw new Error('Reminder was not found.');
      return updated;
    },
    async updateNativeScheduleMetadata(input) {
      const now = clock.nowIso();
      await db.runAsync(
        `INSERT INTO notification_schedule_events (id,reminder_id,native_notification_id,native_schedule_state,last_schedule_attempt_at,last_schedule_error_category,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [ids.nextId(),input.reminderId,input.nativeNotificationId ?? null,input.nativeScheduleState,now,input.errorCategory ?? null,now,now],
      );
    },
    async getNativeScheduleMetadata(reminderId) {
      return db.getFirstAsync<{ nativeNotificationId: string | null; nativeScheduleState: string }>(
        `SELECT native_notification_id AS nativeNotificationId,native_schedule_state AS nativeScheduleState
         FROM notification_schedule_events WHERE reminder_id=? ORDER BY updated_at DESC LIMIT 1`, [reminderId],
      );
    },
  };
}

export function createSqliteNotificationPreferencesRepository(
  db: SqliteDriver, clock: Clock,
): NotificationPreferencesRepository {
  return {
    async get(accountId) {
      return db.getFirstAsync<{ permissionState: string; channelState: string }>(
        `SELECT permission_state AS permissionState,channel_state AS channelState FROM notification_preferences WHERE account_id=?`,
        [accountId],
      );
    },
    async save(input) {
      await db.runAsync(
        `INSERT INTO notification_preferences (account_id,permission_state,channel_state,updated_at) VALUES (?,?,?,?)
         ON CONFLICT(account_id) DO UPDATE SET permission_state=excluded.permission_state,channel_state=excluded.channel_state,updated_at=excluded.updated_at`,
        [input.accountId,input.permissionState,input.channelState,clock.nowIso()],
      );
    },
  };
}
