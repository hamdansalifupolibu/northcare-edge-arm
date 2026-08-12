import type { Migration } from './types';

/**
 * Stage 10: referral workflow fields + referral_passports for opaque QR tokens.
 * Prefer storing token_hash only — never persist raw QR tokens.
 */
const MIGRATION_SQL = `
ALTER TABLE referrals ADD COLUMN reference_code TEXT;
ALTER TABLE referrals ADD COLUMN origin TEXT NOT NULL DEFAULT 'workerInitiated';
ALTER TABLE referrals ADD COLUMN reason_code TEXT;
ALTER TABLE referrals ADD COLUMN reason_content_status TEXT;
ALTER TABLE referrals ADD COLUMN priority_source TEXT NOT NULL DEFAULT 'noEnginePriority';
ALTER TABLE referrals ADD COLUMN communication_notes TEXT;
ALTER TABLE referrals ADD COLUMN worker_notes TEXT;
ALTER TABLE referrals ADD COLUMN active_passport_id TEXT;

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
`;

export const migration004ReferralPassports: Migration = {
  version: 4,
  name: '004_referral_passports',
  checksum: 'stage10-referral-passports-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
