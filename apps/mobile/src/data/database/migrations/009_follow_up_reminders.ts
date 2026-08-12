import type { Migration } from './types';

/** Stage 15: synchronised reminder data and device-local scheduling metadata. */
export const migration009FollowUpReminders: Migration = {
  version: 9,
  name: '009_follow_up_reminders',
  checksum: 'stage15-follow-up-reminders',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS follow_up_reminders (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        organisation_id TEXT NOT NULL,
        facility_id TEXT NOT NULL,
        client_id TEXT,
        encounter_id TEXT,
        source_type TEXT NOT NULL CHECK (source_type IN ('workerCreated','clientProfile','visit','nutritionAssessment','referral','approvedGuidance','remoteAuthorisedReminder')),
        source_entity_id TEXT,
        reminder_type TEXT NOT NULL CHECK (reminder_type IN ('generalFollowUp','visitFollowUp','nutritionFollowUp','referralFollowUp','recordReview')),
        status TEXT NOT NULL CHECK (status IN ('draft','active','snoozed','handled','cancelled','expired','needsReview','scheduleFailed')),
        scheduled_for_utc TEXT NOT NULL,
        original_time_zone TEXT NOT NULL,
        original_local_date TEXT NOT NULL,
        original_local_time TEXT NOT NULL,
        time_zone_policy_version INTEGER NOT NULL DEFAULT 1,
        privacy_level TEXT NOT NULL DEFAULT 'private',
        note TEXT,
        created_by_account_id TEXT NOT NULL,
        handled_by_account_id TEXT,
        handled_at TEXT,
        cancelled_at TEXT,
        snoozed_from_utc TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        local_version INTEGER NOT NULL DEFAULT 1,
        server_version INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        deleted_at TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_reminders_account_status
        ON follow_up_reminders(account_id, status, scheduled_for_utc);
      CREATE INDEX IF NOT EXISTS idx_reminders_client_schedule
        ON follow_up_reminders(client_id, scheduled_for_utc);
      CREATE INDEX IF NOT EXISTS idx_reminders_sync_status
        ON follow_up_reminders(sync_status);

      CREATE TABLE IF NOT EXISTS notification_preferences (
        account_id TEXT PRIMARY KEY NOT NULL,
        permission_state TEXT NOT NULL DEFAULT 'unknown',
        channel_state TEXT NOT NULL DEFAULT 'unknown',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_schedule_events (
        id TEXT PRIMARY KEY NOT NULL,
        reminder_id TEXT NOT NULL,
        native_notification_id TEXT,
        native_schedule_state TEXT NOT NULL,
        last_schedule_attempt_at TEXT,
        last_schedule_error_category TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notification_events_reminder
        ON notification_schedule_events(reminder_id, updated_at DESC);
    `);
  },
};
