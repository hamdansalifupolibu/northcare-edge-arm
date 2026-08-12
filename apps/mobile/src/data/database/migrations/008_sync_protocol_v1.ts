import type { Migration } from './types';

/** Stage 14: durable client conflict and cursor state for sync protocol v1. */
export const migration008SyncProtocolV1: Migration = {
  version: 8,
  name: '008_sync_protocol_v1',
  checksum: 'stage14-sync-protocol-v1',
  async up(db) {
    await db.execAsync(`
      ALTER TABLE sync_queue_items ADD COLUMN operation_id TEXT;
      ALTER TABLE sync_queue_items ADD COLUMN payload_json TEXT;
      ALTER TABLE sync_queue_items ADD COLUMN base_server_version INTEGER;
      ALTER TABLE sync_queue_items ADD COLUMN client_local_version INTEGER;
      ALTER TABLE sync_queue_items ADD COLUMN request_hash TEXT;
      ALTER TABLE sync_queue_items ADD COLUMN occurred_at TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_operation_id
        ON sync_queue_items(operation_id) WHERE operation_id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS sync_state (
        scope_key TEXT PRIMARY KEY NOT NULL,
        pull_cursor TEXT,
        device_id TEXT,
        last_sync_at TEXT,
        last_sync_error_category TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id TEXT PRIMARY KEY NOT NULL,
        server_conflict_id TEXT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        conflict_class TEXT NOT NULL,
        local_operation_id TEXT,
        local_payload_json TEXT,
        server_payload_json TEXT,
        server_version INTEGER,
        state TEXT NOT NULL CHECK (state IN ('open', 'resolved', 'keptForReview')),
        resolution_action TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_sync_conflicts_state ON sync_conflicts(state, created_at);
    `);
  },
};
