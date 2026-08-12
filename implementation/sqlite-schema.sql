-- NorthCare AI SQLite schema export
-- Authoritative runtime source: apps/mobile/src/data/database/migrations/001_initial_schema.ts
-- Migration version: 1
-- Generated for review only — do not treat as a second runtime schema source.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  checksum TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY NOT NULL,
  external_code TEXT,
  name TEXT NOT NULL,
  facility_type TEXT,
  district TEXT,
  region TEXT,
  latitude REAL,
  longitude REAL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
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

CREATE TABLE IF NOT EXISTS local_account_references (
  account_id TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'administrator')),
  facility_id TEXT REFERENCES facilities(id),
  display_name TEXT NOT NULL,
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY NOT NULL,
  client_code TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pregnant', 'postnatal', 'newborn', 'childUnderFive')),
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  preferred_name TEXT,
  sex TEXT,
  date_of_birth TEXT,
  approximate_age INTEGER,
  approximate_age_unit TEXT CHECK (approximate_age_unit IS NULL OR approximate_age_unit IN ('days','weeks','months','years')),
  pregnancy_status TEXT,
  estimated_delivery_date TEXT,
  phone_number TEXT,
  community TEXT,
  district TEXT,
  region TEXT,
  primary_facility_id TEXT REFERENCES facilities(id),
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'recorded', 'declined', 'deferred', 'notApplicable')),
  consent_recorded_at TEXT,
  notes TEXT,
  search_normalized TEXT NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_client_code_active
  ON clients(client_code) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_clients_search_normalized ON clients(search_normalized);
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);
CREATE INDEX IF NOT EXISTS idx_clients_facility ON clients(primary_facility_id);
CREATE INDEX IF NOT EXISTS idx_clients_is_deleted ON clients(is_deleted);

CREATE TABLE IF NOT EXISTS caregivers (
  id TEXT PRIMARY KEY NOT NULL,
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  phone_number TEXT,
  community TEXT,
  notes TEXT,
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

CREATE TABLE IF NOT EXISTS client_relationships (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  caregiver_id TEXT NOT NULL REFERENCES caregivers(id),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('mother', 'father', 'guardian', 'grandparent', 'other')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  valid_from TEXT,
  valid_to TEXT,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_relationships_one_primary
  ON client_relationships(client_id) WHERE is_primary = 1 AND is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_client_relationships_client ON client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_caregiver ON client_relationships(caregiver_id);

CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  encounter_type TEXT NOT NULL,
  occurred_at TEXT,
  facility_id TEXT REFERENCES facilities(id),
  worker_account_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'inProgress', 'completed', 'cancelled')),
  started_at TEXT,
  completed_at TEXT,
  draft_saved_at TEXT,
  source TEXT,
  notes TEXT,
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

CREATE INDEX IF NOT EXISTS idx_encounters_client_occurred ON encounters(client_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);

CREATE TABLE IF NOT EXISTS screenings (
  id TEXT PRIMARY KEY NOT NULL,
  encounter_id TEXT NOT NULL REFERENCES encounters(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  screening_type TEXT NOT NULL CHECK (screening_type IN ('antenatal', 'postnatal', 'newborn', 'childUnderFive', 'nutrition')),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version >= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'inProgress', 'completed', 'cancelled')),
  started_at TEXT,
  completed_at TEXT,
  reviewed_by_account_id TEXT,
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

CREATE INDEX IF NOT EXISTS idx_screenings_encounter ON screenings(encounter_id);
CREATE INDEX IF NOT EXISTS idx_screenings_client ON screenings(client_id);

CREATE TABLE IF NOT EXISTS screening_answers (
  id TEXT PRIMARY KEY NOT NULL,
  screening_id TEXT NOT NULL REFERENCES screenings(id),
  question_key TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('boolean', 'number', 'text', 'date', 'option', 'multipleOptions', 'unknown')),
  boolean_value INTEGER CHECK (boolean_value IS NULL OR boolean_value IN (0, 1)),
  number_value REAL,
  text_value TEXT,
  date_value TEXT,
  option_value TEXT,
  multiple_options_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  UNIQUE (screening_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_screening_answers_screening ON screening_answers(screening_id);

CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY NOT NULL,
  encounter_id TEXT REFERENCES encounters(id),
  screening_id TEXT REFERENCES screenings(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  measurement_type TEXT NOT NULL,
  numeric_value REAL NOT NULL,
  unit TEXT NOT NULL,
  measured_at TEXT NOT NULL,
  entered_by_account_id TEXT,
  device_source TEXT,
  notes TEXT,
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

CREATE INDEX IF NOT EXISTS idx_measurements_client ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_encounter ON measurements(encounter_id);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  encounter_id TEXT REFERENCES encounters(id),
  screening_id TEXT REFERENCES screenings(id),
  priority TEXT NOT NULL CHECK (priority IN ('red', 'amber', 'green', 'undetermined')),
  rule_set_version TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  confirmed_by_account_id TEXT,
  confirmed_at TEXT,
  explanation_summary TEXT,
  missing_information TEXT,
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

CREATE INDEX IF NOT EXISTS idx_risk_assessments_client ON risk_assessments(client_id);

CREATE TABLE IF NOT EXISTS risk_factors (
  id TEXT PRIMARY KEY NOT NULL,
  risk_assessment_id TEXT NOT NULL REFERENCES risk_assessments(id),
  factor_code TEXT NOT NULL,
  factor_label TEXT NOT NULL,
  source_question_key TEXT,
  severity TEXT,
  rule_version TEXT,
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

CREATE INDEX IF NOT EXISTS idx_risk_factors_assessment ON risk_factors(risk_assessment_id);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  encounter_id TEXT REFERENCES encounters(id),
  risk_assessment_id TEXT REFERENCES risk_assessments(id),
  source_facility_id TEXT REFERENCES facilities(id),
  receiving_facility_id TEXT REFERENCES facilities(id),
  priority TEXT NOT NULL CHECK (priority IN ('red', 'amber', 'green', 'undetermined')),
  reason_summary TEXT,
  transport_status TEXT NOT NULL DEFAULT 'unknown',
  caregiver_informed INTEGER NOT NULL DEFAULT 0 CHECK (caregiver_informed IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('draft', 'created', 'caregiverInformed', 'journeyStarted', 'facilityReached', 'patientReceived', 'completed', 'cancelled', 'overdue')),
  completed_at TEXT,
  qr_payload_version INTEGER,
  reference_code TEXT,
  origin TEXT NOT NULL DEFAULT 'workerInitiated',
  reason_code TEXT,
  reason_content_status TEXT,
  priority_source TEXT NOT NULL DEFAULT 'noEnginePriority',
  communication_notes TEXT,
  worker_notes TEXT,
  active_passport_id TEXT,
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

CREATE INDEX IF NOT EXISTS idx_referrals_client ON referrals(client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_receiving_facility ON referrals(receiving_facility_id);
CREATE INDEX IF NOT EXISTS idx_referrals_updated ON referrals(updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_reference_code
  ON referrals(reference_code) WHERE reference_code IS NOT NULL AND is_deleted = 0;

CREATE TABLE IF NOT EXISTS referral_passports (
  id TEXT PRIMARY KEY NOT NULL,
  referral_id TEXT NOT NULL REFERENCES referrals(id),
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired', 'superseded')),
  payload_version INTEGER NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  revoked_reason TEXT,
  superseded_by_passport_id TEXT,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_passports_token_hash
  ON referral_passports(token_hash) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_referral_passports_referral
  ON referral_passports(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_passports_status
  ON referral_passports(status);
CREATE INDEX IF NOT EXISTS idx_referral_passports_expires
  ON referral_passports(expires_at);

CREATE TABLE IF NOT EXISTS referral_events (
  id TEXT PRIMARY KEY NOT NULL,
  referral_id TEXT NOT NULL REFERENCES referrals(id),
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  recorded_by_account_id TEXT,
  facility_id TEXT REFERENCES facilities(id),
  notes TEXT,
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

CREATE INDEX IF NOT EXISTS idx_referral_events_referral_occurred
  ON referral_events(referral_id, occurred_at);

CREATE TABLE IF NOT EXISTS nutrition_assessments (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  encounter_id TEXT REFERENCES encounters(id),
  assessment_date TEXT NOT NULL,
  breastfeeding_status TEXT,
  complementary_feeding_status TEXT,
  meals_per_day INTEGER,
  food_diversity_score REAL,
  guidance_content_version TEXT,
  follow_up_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed', 'cancelled')),
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

CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_client ON nutrition_assessments(client_id);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY NOT NULL,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  checksum TEXT,
  encryption_status TEXT NOT NULL DEFAULT 'none' CHECK (encryption_status IN ('none', 'planned', 'unknown')),
  upload_status TEXT NOT NULL DEFAULT 'localOnly' CHECK (upload_status IN ('localOnly', 'pending', 'uploaded', 'failed')),
  duration_ms INTEGER,
  audio_format_version INTEGER,
  original_filename TEXT,
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

CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS sync_queue_items (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'uploadAttachment')),
  payload_version INTEGER NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  state TEXT NOT NULL CHECK (state IN ('pending', 'processing', 'completed', 'failed', 'blocked', 'conflict')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TEXT,
  last_attempt_at TEXT,
  last_error_category TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_active_unique
  ON sync_queue_items(entity_type, entity_id, operation)
  WHERE state IN ('pending', 'processing', 'failed', 'blocked', 'conflict');
CREATE INDEX IF NOT EXISTS idx_sync_queue_state_next ON sync_queue_items(state, next_attempt_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  actor_account_id TEXT,
  occurred_at TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_entity_time ON audit_events(entity_type, entity_id, occurred_at);

-- Stage 11 voice capture (schema version 5). Audio bytes are never stored in SQLite.
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

CREATE INDEX IF NOT EXISTS idx_voice_sessions_client ON voice_capture_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_encounter ON voice_capture_sessions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_capture_sessions(status);

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

CREATE INDEX IF NOT EXISTS idx_voice_transcripts_session ON voice_transcripts(voice_capture_session_id);

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

CREATE INDEX IF NOT EXISTS idx_voice_extraction_runs_session ON voice_extraction_runs(voice_capture_session_id);

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

CREATE INDEX IF NOT EXISTS idx_voice_suggestions_run ON voice_extraction_suggestions(extraction_run_id);
CREATE INDEX IF NOT EXISTS idx_voice_suggestions_review ON voice_extraction_suggestions(review_status);

-- Stage 12 nutrition assessment engine (schema version 6).
-- Authoritative migration: apps/mobile/src/data/database/migrations/006_nutrition_assessment_engine.ts
-- Expands nutrition_assessments with template/progress/confirmation columns.
-- Capture reuses Stage 8 answer semantics; rows stored in nutrition_assessment_answers (not screening_answers).

-- ALTER TABLE nutrition_assessments ADD COLUMN assessment_type TEXT;
-- ALTER TABLE nutrition_assessments ADD COLUMN template_id TEXT;
-- ALTER TABLE nutrition_assessments ADD COLUMN template_version INTEGER;
-- (see migration 006 for full ALTER list)

CREATE TABLE IF NOT EXISTS nutrition_assessment_answers (
  id TEXT PRIMARY KEY NOT NULL,
  nutrition_assessment_id TEXT NOT NULL REFERENCES nutrition_assessments(id),
  question_key TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('boolean', 'number', 'text', 'date', 'option', 'multipleOptions', 'unknown')),
  boolean_value INTEGER CHECK (boolean_value IS NULL OR boolean_value IN (0, 1)),
  number_value REAL,
  text_value TEXT,
  date_value TEXT,
  option_value TEXT,
  multiple_options_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  UNIQUE (nutrition_assessment_id, question_key)
);

CREATE TABLE IF NOT EXISTS nutrition_measurement_links (
  id TEXT PRIMARY KEY NOT NULL,
  nutrition_assessment_id TEXT NOT NULL REFERENCES nutrition_assessments(id),
  measurement_id TEXT NOT NULL REFERENCES measurements(id),
  question_key TEXT,
  link_role TEXT NOT NULL DEFAULT 'associated',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by_account_id TEXT,
  updated_by_account_id TEXT,
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  UNIQUE (nutrition_assessment_id, measurement_id)
);

CREATE TABLE IF NOT EXISTS nutrition_reference_results (
  id TEXT PRIMARY KEY NOT NULL,
  nutrition_assessment_id TEXT NOT NULL REFERENCES nutrition_assessments(id),
  reference_pack_id TEXT NOT NULL,
  reference_pack_version INTEGER NOT NULL,
  engine_version INTEGER NOT NULL,
  result_status TEXT NOT NULL,
  interpretation_code TEXT,
  derived_value REAL,
  derived_unit TEXT,
  missing_information_json TEXT,
  input_measurement_ids_json TEXT,
  explanation_id TEXT,
  calculated_at TEXT NOT NULL,
  supersedes_result_id TEXT,
  is_development INTEGER NOT NULL DEFAULT 0 CHECK (is_development IN (0, 1)),
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

CREATE TABLE IF NOT EXISTS nutrition_guidance_resolutions (
  id TEXT PRIMARY KEY NOT NULL,
  nutrition_assessment_id TEXT NOT NULL REFERENCES nutrition_assessments(id),
  guidance_pack_id TEXT,
  guidance_pack_version INTEGER,
  resolution_status TEXT NOT NULL,
  guidance_ids_json TEXT,
  resolved_at TEXT NOT NULL,
  acknowledged_by_account_id TEXT,
  acknowledged_at TEXT,
  supersedes_resolution_id TEXT,
  is_development INTEGER NOT NULL DEFAULT 0 CHECK (is_development IN (0, 1)),
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

-- Stage 13: Ask NorthCare feedback (knowledge packs remain bundled assets)
CREATE TABLE IF NOT EXISTS assistant_feedback (
  id TEXT PRIMARY KEY NOT NULL,
  article_id TEXT NOT NULL,
  knowledge_pack_id TEXT NOT NULL,
  knowledge_pack_version INTEGER NOT NULL CHECK (knowledge_pack_version >= 1),
  answer_mode TEXT NOT NULL,
  feedback_category TEXT NOT NULL CHECK (
    feedback_category IN ('helpful', 'notHelpful', 'reportContentIssue')
  ),
  content_issue_category TEXT,
  optional_note TEXT,
  created_by_account_id TEXT,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE TABLE IF NOT EXISTS assistant_content_issues (
  id TEXT PRIMARY KEY NOT NULL,
  article_id TEXT NOT NULL,
  knowledge_pack_id TEXT NOT NULL,
  knowledge_pack_version INTEGER NOT NULL CHECK (knowledge_pack_version >= 1),
  issue_category TEXT NOT NULL,
  optional_note TEXT,
  created_by_account_id TEXT,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);
-- Stage 15: follow-up reminders + device-local notification scheduling metadata
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  client_id TEXT,
  encounter_id TEXT,
  source_type TEXT NOT NULL,
  source_entity_id TEXT,
  reminder_type TEXT NOT NULL,
  status TEXT NOT NULL,
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
