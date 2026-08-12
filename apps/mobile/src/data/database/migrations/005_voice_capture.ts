import type { Migration } from './types';

/**
 * Stage 11: voice capture sessions, transcripts, extraction runs/suggestions.
 * Audio bytes remain on the filesystem — never as SQLite blobs.
 */
const MIGRATION_SQL = `
ALTER TABLE attachments ADD COLUMN duration_ms INTEGER;
ALTER TABLE attachments ADD COLUMN audio_format_version INTEGER;
ALTER TABLE attachments ADD COLUMN original_filename TEXT;

CREATE TABLE IF NOT EXISTS voice_capture_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  encounter_id TEXT REFERENCES encounters(id),
  attachment_id TEXT REFERENCES attachments(id),
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'consentPending', 'readyToRecord', 'recording', 'recorded',
    'transcribing', 'transcriptReady', 'extracting', 'reviewRequired',
    'confirmed', 'discarded', 'failed'
  )),
  ui_state TEXT NOT NULL DEFAULT 'idle',
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN (
    'unknown', 'recorded', 'declined', 'deferred', 'notApplicable'
  )),
  consent_version TEXT,
  language_hint TEXT,
  duration_ms INTEGER,
  audio_format_version INTEGER,
  transcription_provider_id TEXT,
  transcription_provider_version TEXT,
  extraction_provider_id TEXT,
  extraction_provider_version TEXT,
  retention_status TEXT NOT NULL DEFAULT 'pendingDecision' CHECK (retention_status IN (
    'pendingDecision', 'retained', 'deleted', 'deleteFailed'
  )),
  completed_at TEXT,
  discarded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_client
  ON voice_capture_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_encounter
  ON voice_capture_sessions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status
  ON voice_capture_sessions(status);

CREATE TABLE IF NOT EXISTS voice_transcripts (
  id TEXT PRIMARY KEY NOT NULL,
  voice_capture_session_id TEXT NOT NULL REFERENCES voice_capture_sessions(id),
  transcript_text TEXT NOT NULL,
  language_code TEXT,
  provider_id TEXT NOT NULL,
  provider_version TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('provider', 'manual', 'developmentSimulation')),
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'readyForReview', 'confirmed', 'rejected', 'failed'
  )),
  is_partial INTEGER NOT NULL DEFAULT 0 CHECK (is_partial IN (0, 1)),
  is_synthetic INTEGER NOT NULL DEFAULT 0 CHECK (is_synthetic IN (0, 1)),
  created_at TEXT NOT NULL,
  confirmed_at TEXT,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_voice_transcripts_session
  ON voice_transcripts(voice_capture_session_id);

CREATE TABLE IF NOT EXISTS voice_extraction_runs (
  id TEXT PRIMARY KEY NOT NULL,
  voice_capture_session_id TEXT NOT NULL REFERENCES voice_capture_sessions(id),
  transcript_id TEXT NOT NULL REFERENCES voice_transcripts(id),
  provider_id TEXT NOT NULL,
  provider_version TEXT NOT NULL,
  extraction_schema_id TEXT NOT NULL,
  extraction_schema_version INTEGER NOT NULL CHECK (extraction_schema_version >= 1),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_voice_extraction_runs_session
  ON voice_extraction_runs(voice_capture_session_id);

CREATE TABLE IF NOT EXISTS voice_extraction_suggestions (
  id TEXT PRIMARY KEY NOT NULL,
  extraction_run_id TEXT NOT NULL REFERENCES voice_extraction_runs(id),
  target_type TEXT NOT NULL CHECK (target_type IN (
    'encounterContext', 'screeningDraftAnswer', 'measurementDraft',
    'controlledVisitNote', 'followUpDraft'
  )),
  target_key TEXT NOT NULL,
  proposed_value_json TEXT NOT NULL,
  confirmed_value_json TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN (
    'boolean', 'number', 'text', 'option', 'measurement', 'note'
  )),
  source_start INTEGER,
  source_end INTEGER,
  source_text_hash TEXT,
  confidence_category TEXT NOT NULL CHECK (confidence_category IN (
    'high', 'medium', 'low', 'uncertain', 'unknown'
  )),
  review_status TEXT NOT NULL DEFAULT 'pendingReview' CHECK (review_status IN (
    'pendingReview', 'accepted', 'edited', 'rejected'
  )),
  reviewed_by_account_id TEXT,
  reviewed_at TEXT,
  rejection_reason_code TEXT CHECK (
    rejection_reason_code IS NULL OR rejection_reason_code IN (
      'incorrect', 'notDiscussed', 'unsafeInference', 'wrongField', 'other'
    )
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_voice_suggestions_run
  ON voice_extraction_suggestions(extraction_run_id);
CREATE INDEX IF NOT EXISTS idx_voice_suggestions_review
  ON voice_extraction_suggestions(review_status);
`;

export const migration005VoiceCapture: Migration = {
  version: 5,
  name: '005_voice_capture',
  checksum: 'stage11-voice-capture-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
