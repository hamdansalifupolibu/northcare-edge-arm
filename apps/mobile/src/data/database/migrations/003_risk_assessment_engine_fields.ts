import type { Migration } from './types';

/**
 * Stage 9: extend risk_assessments / risk_factors for engine versioning,
 * supersession, and explainability metadata. Reuses existing tables.
 */
const MIGRATION_SQL = `
ALTER TABLE risk_assessments ADD COLUMN evaluation_status TEXT NOT NULL DEFAULT 'calculated';
ALTER TABLE risk_assessments ADD COLUMN engine_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE risk_assessments ADD COLUMN rule_pack_id TEXT;
ALTER TABLE risk_assessments ADD COLUMN rule_pack_version INTEGER;
ALTER TABLE risk_assessments ADD COLUMN screening_template_id TEXT;
ALTER TABLE risk_assessments ADD COLUMN screening_template_version INTEGER;
ALTER TABLE risk_assessments ADD COLUMN explanation_version TEXT;
ALTER TABLE risk_assessments ADD COLUMN input_digest TEXT;
ALTER TABLE risk_assessments ADD COLUMN supersedes_risk_assessment_id TEXT;
ALTER TABLE risk_assessments ADD COLUMN recalculation_reason TEXT;
ALTER TABLE risk_assessments ADD COLUMN is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1));
ALTER TABLE risk_assessments ADD COLUMN undetermined_reason_category TEXT;
ALTER TABLE risk_assessments ADD COLUMN development_banner TEXT;
ALTER TABLE risk_assessments ADD COLUMN explanation_detail TEXT;
ALTER TABLE risk_assessments ADD COLUMN aggregation_strategy TEXT;
ALTER TABLE risk_assessments ADD COLUMN aggregation_strategy_version INTEGER;

CREATE INDEX IF NOT EXISTS idx_risk_assessments_screening_current
  ON risk_assessments(screening_id, is_current);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_encounter
  ON risk_assessments(encounter_id);

ALTER TABLE risk_factors ADD COLUMN rule_id TEXT;
ALTER TABLE risk_factors ADD COLUMN priority TEXT;
ALTER TABLE risk_factors ADD COLUMN explanation_id TEXT;
ALTER TABLE risk_factors ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE risk_factors ADD COLUMN source_measurement_id TEXT;
`;

export const migration003RiskAssessmentEngineFields: Migration = {
  version: 3,
  name: '003_risk_assessment_engine_fields',
  checksum: 'stage9-risk-assessment-engine-fields-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
