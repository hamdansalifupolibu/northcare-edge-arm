import type { SyncQueueItem } from '../../domain/entities/entities';
import {
  isOneOf,
  SYNC_QUEUE_OPERATIONS,
  SYNC_QUEUE_STATES,
} from '../../domain/enums/domainEnums';
import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type { EnqueueSyncInput, SyncQueueRepository } from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';

type SyncRow = {
  id: string;
  operation_id: string | null;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload_version: number;
  state: string;
  attempt_count: number;
  next_attempt_at: string | null;
  last_attempt_at: string | null;
  last_error_category: string | null;
  created_at: string;
  updated_at: string;
  priority: number;
  payload_json: string | null;
  base_server_version: number | null;
  client_local_version: number | null;
  request_hash: string | null;
  occurred_at: string | null;
};

function mapItem(row: SyncRow): SyncQueueItem {
  if (!isOneOf(row.operation, SYNC_QUEUE_OPERATIONS)) {
    throw new RepositoryError('dataIntegrity', 'Invalid sync operation');
  }
  if (!isOneOf(row.state, SYNC_QUEUE_STATES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid sync state');
  }
  return {
    id: assertEntityId(row.id),
    operationId: row.operation_id ? assertEntityId(row.operation_id) : null,
    entityType: row.entity_type,
    entityId: assertEntityId(row.entity_id),
    operation: row.operation,
    payloadVersion: row.payload_version,
    state: row.state,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at
      ? assertIsoUtcTimestamp(row.next_attempt_at)
      : null,
    lastAttemptAt: row.last_attempt_at
      ? assertIsoUtcTimestamp(row.last_attempt_at)
      : null,
    lastErrorCategory: row.last_error_category,
    createdAt: assertIsoUtcTimestamp(row.created_at),
    updatedAt: assertIsoUtcTimestamp(row.updated_at),
    priority: row.priority,
    payloadJson: row.payload_json,
    baseServerVersion: row.base_server_version,
    clientLocalVersion: row.client_local_version,
    requestHash: row.request_hash,
    occurredAt: row.occurred_at ? assertIsoUtcTimestamp(row.occurred_at) : null,
  };
}

export function createSqliteSyncQueueRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): SyncQueueRepository {
  return {
    async enqueue(input: EnqueueSyncInput): Promise<SyncQueueItem> {
      try {
        const now = clock.nowIso();
        const nextAttemptAt = input.nextAttemptAt ?? now;
        const payloadVersion = input.payloadVersion ?? 1;
        const priority = input.priority ?? 100;

        const activeRow = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM sync_queue_items
           WHERE entity_type = ? AND entity_id = ? AND operation = ?
             AND state IN ('pending', 'processing', 'failed', 'blocked', 'conflict')`,
          [input.entityType, input.entityId, input.operation],
        );

        if (activeRow) {
          await db.runAsync(
            `UPDATE sync_queue_items SET
              payload_version = ?,
              payload_json = ?,
              base_server_version = ?,
              client_local_version = ?,
              request_hash = ?,
              occurred_at = ?,
              state = 'pending',
              attempt_count = 0,
              next_attempt_at = ?,
              last_attempt_at = NULL,
              last_error_category = NULL,
              updated_at = ?,
              priority = ?
             WHERE id = ?`,
            [
              payloadVersion,
              input.payloadJson ?? null,
              input.baseServerVersion ?? null,
              input.clientLocalVersion ?? null,
              input.requestHash ?? null,
              input.occurredAt ?? now,
              nextAttemptAt,
              now,
              priority,
              activeRow.id,
            ],
          );
          const updated = await this.findById(activeRow.id);
          if (!updated) {
            throw new RepositoryError('unknown', 'Sync queue read-back failed');
          }
          return updated;
        }

        const id = input.id ?? ids.nextId();
        const operationId = input.operationId ?? ids.nextId();
        await db.runAsync(
          `INSERT INTO sync_queue_items (
            id, operation_id, entity_type, entity_id, operation, payload_version, state,
            attempt_count, next_attempt_at, last_attempt_at, last_error_category,
            created_at, updated_at, priority, payload_json, base_server_version,
            client_local_version, request_hash, occurred_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            operationId,
            input.entityType,
            input.entityId,
            input.operation,
            payloadVersion,
            nextAttemptAt,
            now,
            now,
            priority,
            input.payloadJson ?? null,
            input.baseServerVersion ?? null,
            input.clientLocalVersion ?? null,
            input.requestHash ?? null,
            input.occurredAt ?? now,
          ],
        );
        const created = await this.findById(id);
        if (!created) {
          throw new RepositoryError('unknown', 'Sync queue read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.enqueue');
      }
    },

    async findById(id) {
      try {
        const row = await db.getFirstAsync<SyncRow>(
          `SELECT * FROM sync_queue_items WHERE id = ?`,
          [id],
        );
        return row ? mapItem(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.findById');
      }
    },

    async listByState(state) {
      try {
        const rows = await db.getAllAsync<SyncRow>(
          `SELECT * FROM sync_queue_items WHERE state = ? ORDER BY priority ASC, created_at ASC`,
          [state],
        );
        return rows.map(mapItem);
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.listByState');
      }
    },

    async listReady(now) {
      try {
        const rows = await db.getAllAsync<SyncRow>(
          `SELECT * FROM sync_queue_items
           WHERE state IN ('pending', 'failed') AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
           ORDER BY priority ASC, created_at ASC`,
          [now],
        );
        return rows.map(mapItem);
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.listReady');
      }
    },

    async incrementAttempts(id, errorCategory = null) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE sync_queue_items SET
            attempt_count = attempt_count + 1,
            last_attempt_at = ?,
            last_error_category = COALESCE(?, last_error_category),
            updated_at = ?
           WHERE id = ?`,
          [now, errorCategory, now, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Sync queue item not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.incrementAttempts');
      }
    },

    async scheduleRetry(id, nextAttemptAt) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE sync_queue_items SET
            state = 'pending', next_attempt_at = ?, updated_at = ?
           WHERE id = ?`,
          [nextAttemptAt, now, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Sync queue item not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.scheduleRetry');
      }
    },

    async markFailed(id, errorCategory) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE sync_queue_items SET
            state = 'failed', last_error_category = ?, last_attempt_at = ?, updated_at = ?
           WHERE id = ?`,
          [errorCategory, now, now, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Sync queue item not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.markFailed');
      }
    },

    async markConflict(id) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE sync_queue_items SET state = 'conflict', updated_at = ? WHERE id = ?`,
          [now, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Sync queue item not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.markConflict');
      }
    },

    async markCompleted(id) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE sync_queue_items SET state = 'completed', updated_at = ? WHERE id = ?`,
          [now, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Sync queue item not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.markCompleted');
      }
    },

    async setProtocolPayload(input) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE sync_queue_items SET payload_json = ?, base_server_version = ?, client_local_version = ?,
            request_hash = ?, occurred_at = ?, updated_at = ? WHERE id = ?`,
          [input.payloadJson, input.baseServerVersion, input.clientLocalVersion, input.requestHash, input.occurredAt, now, input.id],
        );
        const updated = await this.findById(input.id);
        if (!updated) throw new RepositoryError('notFound', 'Sync queue item not found');
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'syncQueue.setProtocolPayload');
      }
    },
  };
}
