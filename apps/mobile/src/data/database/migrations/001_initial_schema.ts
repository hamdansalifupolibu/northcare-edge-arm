import type { Migration } from './types';

/**
 * Authoritative Stage 6 initial schema.
 * Never silently edit after release — add a new migration instead.
 */
export const INITIAL_SCHEMA_SQL = `
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
  pregnancy_status TEXT,
  estimated_delivery_date TEXT,
  phone_number TEXT,
  community TEXT,
  district TEXT,
  region TEXT,
  primary_facility_id TEXT REFERENCES facilities(id),
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'granted', 'declined', 'withdrawn')),
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
`;

export const migration001InitialSchema: Migration = {
  version: 1,
  name: '001_initial_schema',
  checksum: 'stage6-initial-schema-v1',
  async up(db) {
    await db.execAsync(INITIAL_SCHEMA_SQL);
  },
};
