import type { Clock } from '../../domain/value-objects/clock';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type { SyncConflictRepository, SyncStateRepository } from '../contracts/types';

export function createSqliteSyncStateRepository(
  db: SqliteDriver,
  clock: Clock,
): SyncStateRepository {
  return {
    async get(scopeKey) {
      const row = await db.getFirstAsync<{
        pull_cursor: string | null;
        device_id: string | null;
        last_sync_at: string | null;
        last_sync_error_category: string | null;
      }>('SELECT pull_cursor, device_id, last_sync_at, last_sync_error_category FROM sync_state WHERE scope_key = ?', [scopeKey]);
      return row ? {
        pullCursor: row.pull_cursor,
        deviceId: row.device_id,
        lastSyncAt: row.last_sync_at as never,
        lastSyncErrorCategory: row.last_sync_error_category,
      } : null;
    },
    async upsert(input) {
      const existing = await this.get(input.scopeKey);
      await db.runAsync(
        `INSERT INTO sync_state (scope_key, pull_cursor, device_id, last_sync_at, last_sync_error_category, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(scope_key) DO UPDATE SET pull_cursor = excluded.pull_cursor, device_id = excluded.device_id,
           last_sync_at = excluded.last_sync_at, last_sync_error_category = excluded.last_sync_error_category, updated_at = excluded.updated_at`,
        [input.scopeKey, input.pullCursor ?? existing?.pullCursor ?? null, input.deviceId ?? existing?.deviceId ?? null,
          input.lastSyncAt ?? existing?.lastSyncAt ?? null, input.lastSyncErrorCategory ?? existing?.lastSyncErrorCategory ?? null, clock.nowIso()],
      );
    },
  };
}

export function createSqliteSyncConflictRepository(
  db: SqliteDriver,
  clock: Clock,
): SyncConflictRepository {
  return {
    async listOpen() {
      const rows = await db.getAllAsync<{
        id: string;
        serverConflictId: string | null;
        entityType: string;
        entityId: string;
        conflictClass: string;
        state: 'open' | 'resolved' | 'keptForReview';
      }>('SELECT id, server_conflict_id AS serverConflictId, entity_type AS entityType, entity_id AS entityId, conflict_class AS conflictClass, state FROM sync_conflicts WHERE state = ? ORDER BY created_at ASC', ['open']);
      return rows;
    },
    async upsert(input) {
      const now = clock.nowIso();
      await db.runAsync(
        `INSERT INTO sync_conflicts (id, server_conflict_id, entity_type, entity_id, conflict_class, local_operation_id, local_payload_json, server_payload_json, server_version, state, resolution_action, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET server_conflict_id = excluded.server_conflict_id, conflict_class = excluded.conflict_class,
           local_payload_json = excluded.local_payload_json, server_payload_json = excluded.server_payload_json, server_version = excluded.server_version, state = excluded.state, resolution_action = excluded.resolution_action`,
        [input.id, input.serverConflictId ?? null, input.entityType, input.entityId, input.conflictClass,
          input.localOperationId ?? null, input.localPayloadJson ?? null, input.serverPayloadJson ?? null,
          input.serverVersion ?? null, input.state, input.resolutionAction ?? null, now],
      );
    },
    async resolve(id, state, resolutionAction) {
      await db.runAsync('UPDATE sync_conflicts SET state = ?, resolution_action = ?, resolved_at = ? WHERE id = ?', [state, resolutionAction, clock.nowIso(), id]);
    },
  };
}
