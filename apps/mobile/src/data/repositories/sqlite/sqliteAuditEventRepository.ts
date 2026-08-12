import type { AuditEvent } from '../../domain/entities/entities';
import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  AuditEventRepository,
  ListRecentAuditEventsInput,
  RecordAuditEventInput,
} from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import { optionalEntityId } from './rowHelpers';

const PROHIBITED_METADATA_KEYS =
  /(password|pin|token|secret|authorization|bearer|transcript|qr[_-]?payload|screening[_-]?answer|phone|health|diagnosis|symptom)/i;

type AuditRow = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_account_id: string | null;
  occurred_at: string;
  result: string;
  metadata_json: string | null;
};

function sanitizeAuditMetadata(
  metadata: Readonly<Record<string, unknown>> | null | undefined,
): string | null {
  if (metadata == null) {
    return null;
  }
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (PROHIBITED_METADATA_KEYS.test(key)) {
      throw new RepositoryError(
        'validation',
        'Audit metadata contains a prohibited sensitive field',
        { fieldHint: key.slice(0, 40) },
      );
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      safe[key] = value;
    } else {
      safe[key] = '[omitted]';
    }
  }
  return JSON.stringify(safe);
}

function mapAudit(row: AuditRow): AuditEvent {
  return {
    id: assertEntityId(row.id),
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id ? assertEntityId(row.entity_id) : null,
    actorAccountId: optionalEntityId(row.actor_account_id),
    occurredAt: assertIsoUtcTimestamp(row.occurred_at),
    result: row.result,
    metadataJson: row.metadata_json,
  };
}

export function createSqliteAuditEventRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): AuditEventRepository {
  return {
    async record(input: RecordAuditEventInput): Promise<AuditEvent> {
      try {
        const id = input.id ?? ids.nextId();
        const occurredAt = clock.nowIso();
        const metadataJson = sanitizeAuditMetadata(input.metadata);
        await db.runAsync(
          `INSERT INTO audit_events (
            id, event_type, entity_type, entity_id, actor_account_id,
            occurred_at, result, metadata_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            input.eventType,
            input.entityType,
            input.entityId ?? null,
            optionalEntityId(input.actorAccountId),
            occurredAt,
            input.result,
            metadataJson,
          ],
        );
        const row = await db.getFirstAsync<AuditRow>(
          `SELECT * FROM audit_events WHERE id = ?`,
          [id],
        );
        if (!row) {
          throw new RepositoryError('unknown', 'Audit event read-back failed');
        }
        return mapAudit(row);
      } catch (error) {
        throw mapSqliteError(error, 'audit.record');
      }
    },

    async listForEntity(entityType, entityId) {
      try {
        const rows = await db.getAllAsync<AuditRow>(
          `SELECT * FROM audit_events
           WHERE entity_type = ? AND entity_id = ?
           ORDER BY occurred_at ASC`,
          [entityType, entityId],
        );
        return rows.map(mapAudit);
      } catch (error) {
        throw mapSqliteError(error, 'audit.listForEntity');
      }
    },

    async listRecent(input: ListRecentAuditEventsInput = {}) {
      try {
        const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
        const clauses: string[] = [];
        const params: (string | number)[] = [];
        if (input.eventType?.trim()) {
          clauses.push('event_type = ?');
          params.push(input.eventType.trim());
        }
        if (input.entityType?.trim()) {
          clauses.push('entity_type = ?');
          params.push(input.entityType.trim());
        }
        const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        params.push(limit);
        const rows = await db.getAllAsync<AuditRow>(
          `SELECT * FROM audit_events
           ${where}
           ORDER BY occurred_at DESC, rowid DESC
           LIMIT ?`,
          params,
        );
        return rows.map(mapAudit);
      } catch (error) {
        throw mapSqliteError(error, 'audit.listRecent');
      }
    },
  };
}
