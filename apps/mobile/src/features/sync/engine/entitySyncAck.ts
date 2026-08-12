import type { SqliteDriver } from '../../../data/database/connection/SqliteDriver';

const ENTITY_TABLES: Readonly<Record<string, string>> = {
  client: 'clients',
  caregiver: 'caregivers',
  encounter: 'encounters',
  screening: 'screenings',
  referral: 'referrals',
  risk_assessment: 'risk_assessments',
  riskAssessment: 'risk_assessments',
  nutritionAssessment: 'nutrition_assessments',
  nutrition_assessment: 'nutrition_assessments',
  voiceCaptureSession: 'voice_capture_sessions',
  voice_capture_session: 'voice_capture_sessions',
  voiceTranscript: 'voice_transcripts',
  voice_transcript: 'voice_transcripts',
  voiceExtractionRun: 'voice_extraction_runs',
  voice_extraction_run: 'voice_extraction_runs',
  attachment: 'attachments',
  assistant_feedback: 'assistant_feedback',
  facility: 'facilities',
  followUpReminder: 'follow_up_reminders',
  follow_up_reminder: 'follow_up_reminders',
};

/**
 * After a push ACK, mark the local row synced with the server version.
 * Unknown entity types are ignored (queue completion still records the ACK).
 */
export async function acknowledgeLocalEntity(
  db: SqliteDriver,
  entityType: string,
  entityId: string,
  serverVersion: number | null,
  syncedAt: string,
): Promise<void> {
  const table = ENTITY_TABLES[entityType];
  if (!table) return;
  await db.runAsync(
    `UPDATE ${table}
     SET sync_status = 'synced',
         server_version = COALESCE(?, server_version),
         last_synced_at = ?,
         updated_at = ?
     WHERE id = ? AND is_deleted = 0`,
    [serverVersion, syncedAt, syncedAt, entityId],
  );
}
