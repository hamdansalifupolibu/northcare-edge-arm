import type { Migration } from './types';

/** Offline admin worker registration + one-time activation QR (hackathon). */
export const migration011AdminOfflineProvisioning: Migration = {
  version: 11,
  name: '011_admin_offline_provisioning',
  checksum: 'admin-offline-provisioning-v1',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS admin_provisioning_outbox (
        enrollment_id TEXT PRIMARY KEY NOT NULL,
        payload_json TEXT NOT NULL,
        activation_nonce TEXT NOT NULL,
        activation_uri TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'saved_on_device',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS worker_activation_pending (
        enrollment_id TEXT PRIMARY KEY NOT NULL,
        claims_json TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_credentials',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS consumed_activation_nonces (
        nonce TEXT PRIMARY KEY NOT NULL,
        consumed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_reference_cache (
        cache_key TEXT PRIMARY KEY NOT NULL,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_admin_provisioning_outbox_status
        ON admin_provisioning_outbox (status);
    `);
  },
};
