import type { Migration } from './types';

/**
 * Stage 12: expand nutrition assessments + reference/guidance/answer/measurement-link tables.
 * Capture ≠ interpretation ≠ guidance. No clinical thresholds invented here.
 */
const MIGRATION_SQL = `
ALTER TABLE nutrition_assessments ADD COLUMN assessment_type TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN template_id TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN template_version INTEGER;
ALTER TABLE nutrition_assessments ADD COLUMN facility_id TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN started_at TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN completed_at TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN confirmed_by_account_id TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN confirmed_at TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN follow_up_source TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN progress_section_id TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN superseded_by_id TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN supersedes_id TEXT;
ALTER TABLE nutrition_assessments ADD COLUMN engine_version INTEGER;
ALTER TABLE nutrition_assessments ADD COLUMN discard_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_client_status
  ON nutrition_assessments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_template
  ON nutrition_assessments(template_id, template_version);

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

CREATE INDEX IF NOT EXISTS idx_nutrition_answers_assessment
  ON nutrition_assessment_answers(nutrition_assessment_id);

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

CREATE INDEX IF NOT EXISTS idx_nutrition_measurement_links_assessment
  ON nutrition_measurement_links(nutrition_assessment_id);

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

CREATE INDEX IF NOT EXISTS idx_nutrition_reference_results_assessment
  ON nutrition_reference_results(nutrition_assessment_id);

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

CREATE INDEX IF NOT EXISTS idx_nutrition_guidance_resolutions_assessment
  ON nutrition_guidance_resolutions(nutrition_assessment_id);
`;

export const migration006NutritionAssessmentEngine: Migration = {
  version: 6,
  name: '006_nutrition_assessment_engine',
  checksum: 'stage12-nutrition-assessment-engine-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
