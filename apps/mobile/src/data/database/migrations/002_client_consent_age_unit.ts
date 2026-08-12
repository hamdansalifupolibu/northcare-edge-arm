import type { Migration } from './types';

/**
 * Stage 7: consent statuses + approximate age unit.
 * Rebuilds clients table (SQLite cannot alter CHECK constraints in place).
 */
const MIGRATION_SQL = `
PRAGMA foreign_keys = OFF;

CREATE TABLE clients_v2 (
  id TEXT PRIMARY KEY NOT NULL,
  client_code TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pregnant', 'postnatal', 'newborn', 'childUnderFive')),
  given_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  preferred_name TEXT,
  sex TEXT,
  date_of_birth TEXT,
  approximate_age INTEGER,
  approximate_age_unit TEXT CHECK (
    approximate_age_unit IS NULL OR approximate_age_unit IN ('days', 'weeks', 'months', 'years')
  ),
  pregnancy_status TEXT,
  estimated_delivery_date TEXT,
  phone_number TEXT,
  community TEXT,
  district TEXT,
  region TEXT,
  primary_facility_id TEXT REFERENCES facilities(id),
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (
    consent_status IN ('unknown', 'recorded', 'declined', 'deferred', 'notApplicable')
  ),
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
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
  CHECK (
    (date_of_birth IS NULL OR approximate_age IS NULL)
  )
);

INSERT INTO clients_v2 (
  id, client_code, category, given_name, family_name, preferred_name, sex,
  date_of_birth, approximate_age, approximate_age_unit, pregnancy_status, estimated_delivery_date,
  phone_number, community, district, region, primary_facility_id,
  consent_status, consent_recorded_at, notes, search_normalized,
  created_at, updated_at, created_by_account_id, updated_by_account_id,
  local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
)
SELECT
  id, client_code, category, given_name, family_name, preferred_name, sex,
  date_of_birth, approximate_age, NULL, pregnancy_status, estimated_delivery_date,
  phone_number, community, district, region, primary_facility_id,
  CASE consent_status
    WHEN 'granted' THEN 'recorded'
    WHEN 'withdrawn' THEN 'declined'
    WHEN 'recorded' THEN 'recorded'
    WHEN 'declined' THEN 'declined'
    WHEN 'deferred' THEN 'deferred'
    WHEN 'notApplicable' THEN 'notApplicable'
    ELSE 'unknown'
  END,
  consent_recorded_at, notes, search_normalized,
  created_at, updated_at, created_by_account_id, updated_by_account_id,
  local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
FROM clients;

DROP TABLE clients;
ALTER TABLE clients_v2 RENAME TO clients;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_client_code_active
  ON clients(client_code) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_clients_search_normalized ON clients(search_normalized);
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);
CREATE INDEX IF NOT EXISTS idx_clients_facility ON clients(primary_facility_id);
CREATE INDEX IF NOT EXISTS idx_clients_is_deleted ON clients(is_deleted);

PRAGMA foreign_keys = ON;
`;

export const migration002ClientConsentAgeUnit: Migration = {
  version: 2,
  name: '002_client_consent_age_unit',
  checksum: 'stage7-client-consent-age-unit-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
