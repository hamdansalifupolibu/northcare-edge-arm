import type { Screening, ScreeningAnswer } from '../../domain/entities/entities';
import {
  ANSWER_VALUE_TYPES,
  isOneOf,
  SCREENING_STATUSES,
  SCREENING_TYPES,
} from '../../domain/enums/domainEnums';
import type { Clock } from '../../domain/value-objects/clock';
import { assertDateOnly } from '../../domain/value-objects/dateOnly';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  CreateScreeningInput,
  SaveAnswerInput,
  ScreeningRepository,
} from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import {
  boolToInt,
  intToBool,
  mapMetadata,
  newMetadataValues,
  type MetadataRow,
} from './rowHelpers';

type ScreeningRow = MetadataRow & {
  encounter_id: string;
  client_id: string;
  screening_type: string;
  schema_version: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  reviewed_by_account_id: string | null;
};

type AnswerRow = MetadataRow & {
  screening_id: string;
  question_key: string;
  value_type: string;
  boolean_value: number | null;
  number_value: number | null;
  text_value: string | null;
  date_value: string | null;
  option_value: string | null;
  multiple_options_json: string | null;
};

function mapScreening(row: ScreeningRow): Screening {
  const meta = mapMetadata(row);
  if (!isOneOf(row.screening_type, SCREENING_TYPES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid screening type');
  }
  if (!isOneOf(row.status, SCREENING_STATUSES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid screening status');
  }
  return {
    ...meta,
    encounterId: assertEntityId(row.encounter_id),
    clientId: assertEntityId(row.client_id),
    screeningType: row.screening_type,
    schemaVersion: row.schema_version,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    reviewedByAccountId: row.reviewed_by_account_id
      ? assertEntityId(row.reviewed_by_account_id)
      : null,
  };
}

function mapAnswer(row: AnswerRow): ScreeningAnswer {
  const meta = mapMetadata(row);
  if (!isOneOf(row.value_type, ANSWER_VALUE_TYPES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid answer value type');
  }
  return {
    ...meta,
    screeningId: assertEntityId(row.screening_id),
    questionKey: row.question_key,
    valueType: row.value_type,
    booleanValue:
      row.boolean_value === null || row.boolean_value === undefined
        ? null
        : intToBool(row.boolean_value),
    numberValue: row.number_value,
    textValue: row.text_value,
    dateValue: row.date_value ? assertDateOnly(row.date_value) : null,
    optionValue: row.option_value,
    multipleOptionsJson: row.multiple_options_json,
  };
}

function validateAnswerInput(input: SaveAnswerInput): void {
  if (!isOneOf(input.valueType, ANSWER_VALUE_TYPES)) {
    throw new RepositoryError('validation', 'Invalid answer value type');
  }
  switch (input.valueType) {
    case 'boolean':
      if (typeof input.booleanValue !== 'boolean') {
        throw new RepositoryError('validation', 'boolean answer requires booleanValue');
      }
      break;
    case 'number':
      if (typeof input.numberValue !== 'number' || Number.isNaN(input.numberValue)) {
        throw new RepositoryError('validation', 'number answer requires numberValue');
      }
      break;
    case 'text':
      if (typeof input.textValue !== 'string') {
        throw new RepositoryError('validation', 'text answer requires textValue');
      }
      break;
    case 'date':
      if (!input.dateValue) {
        throw new RepositoryError('validation', 'date answer requires dateValue');
      }
      assertDateOnly(input.dateValue);
      break;
    case 'option':
      if (typeof input.optionValue !== 'string') {
        throw new RepositoryError('validation', 'option answer requires optionValue');
      }
      break;
    case 'multipleOptions':
      if (typeof input.multipleOptionsJson !== 'string') {
        throw new RepositoryError(
          'validation',
          'multipleOptions answer requires multipleOptionsJson',
        );
      }
      try {
        const parsed: unknown = JSON.parse(input.multipleOptionsJson);
        if (!Array.isArray(parsed)) {
          throw new Error('not array');
        }
      } catch {
        throw new RepositoryError(
          'validation',
          'multipleOptionsJson must be a JSON array',
        );
      }
      break;
    case 'unknown':
      break;
    default: {
      const _exhaustive: never = input.valueType;
      throw new RepositoryError('validation', String(_exhaustive));
    }
  }
}

export function createSqliteScreeningRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): ScreeningRepository {
  return {
    async create(input: CreateScreeningInput): Promise<Screening> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO screenings (
            id, encounter_id, client_id, screening_type, schema_version, status,
            started_at, completed_at, reviewed_by_account_id,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, 'draft', ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.encounterId,
            input.clientId,
            input.screeningType,
            input.schemaVersion ?? 1,
            meta.created_at,
            meta.created_at,
            meta.updated_at,
            meta.created_by_account_id,
            meta.updated_by_account_id,
            meta.local_version,
            meta.server_version,
            meta.sync_status,
            meta.last_synced_at,
            meta.deleted_at,
            meta.is_deleted,
          ],
        );
        const created = await this.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Screening create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'screening.create');
      }
    },

    async findById(id, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<ScreeningRow>(
          `SELECT * FROM screenings WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [id],
        );
        return row ? mapScreening(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'screening.findById');
      }
    },

    async findByEncounterId(encounterId, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<ScreeningRow>(
          `SELECT * FROM screenings
           WHERE encounter_id = ?
           ${includeDeleted ? '' : 'AND is_deleted = 0'}
           ORDER BY created_at DESC
           LIMIT 1`,
          [encounterId],
        );
        return row ? mapScreening(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'screening.findByEncounterId');
      }
    },

    async saveAnswer(input: SaveAnswerInput): Promise<ScreeningAnswer> {
      try {
        validateAnswerInput(input);
        const screening = await this.findById(input.screeningId);
        if (!screening) {
          throw new RepositoryError('notFound', 'Screening not found');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO screening_answers (
            id, screening_id, question_key, value_type, boolean_value, number_value,
            text_value, date_value, option_value, multiple_options_json,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(screening_id, question_key) DO UPDATE SET
            value_type = excluded.value_type,
            boolean_value = excluded.boolean_value,
            number_value = excluded.number_value,
            text_value = excluded.text_value,
            date_value = excluded.date_value,
            option_value = excluded.option_value,
            multiple_options_json = excluded.multiple_options_json,
            updated_at = excluded.updated_at,
            updated_by_account_id = excluded.updated_by_account_id,
            local_version = screening_answers.local_version + 1,
            sync_status = 'pendingUpdate',
            is_deleted = 0,
            deleted_at = NULL`,
          [
            meta.id,
            input.screeningId,
            input.questionKey,
            input.valueType,
            typeof input.booleanValue === 'boolean' ? boolToInt(input.booleanValue) : null,
            input.numberValue ?? null,
            input.textValue ?? null,
            input.dateValue ?? null,
            input.optionValue ?? null,
            input.multipleOptionsJson ?? null,
            meta.created_at,
            meta.updated_at,
            meta.created_by_account_id,
            meta.updated_by_account_id,
            meta.local_version,
            meta.server_version,
            meta.sync_status,
            meta.last_synced_at,
            meta.deleted_at,
            meta.is_deleted,
          ],
        );
        const row = await db.getFirstAsync<AnswerRow>(
          `SELECT * FROM screening_answers
           WHERE screening_id = ? AND question_key = ? AND is_deleted = 0`,
          [input.screeningId, input.questionKey],
        );
        if (!row) {
          throw new RepositoryError('unknown', 'Answer read-back failed');
        }
        return mapAnswer(row);
      } catch (error) {
        throw mapSqliteError(error, 'screening.saveAnswer');
      }
    },

    async listAnswers(screeningId) {
      try {
        const rows = await db.getAllAsync<AnswerRow>(
          `SELECT * FROM screening_answers
           WHERE screening_id = ? AND is_deleted = 0
           ORDER BY question_key ASC`,
          [screeningId],
        );
        return rows.map(mapAnswer);
      } catch (error) {
        throw mapSqliteError(error, 'screening.listAnswers');
      }
    },

    async markInProgress(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Screening not found');
        }
        if (existing.status === 'completed' || existing.status === 'cancelled') {
          throw new RepositoryError('conflict', 'Closed screening cannot become inProgress');
        }
        if (existing.status === 'inProgress') {
          return existing;
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE screenings SET
            status = 'inProgress',
            started_at = COALESCE(started_at, ?),
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, now, accountId, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Screening markInProgress read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'screening.markInProgress');
      }
    },

    async complete(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Screening not found');
        }
        if (existing.status === 'completed') {
          return existing;
        }
        if (existing.status === 'cancelled') {
          throw new RepositoryError('conflict', 'Cancelled screening cannot be completed');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE screenings SET
            status = 'completed', completed_at = ?,
            reviewed_by_account_id = COALESCE(?, reviewed_by_account_id),
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, accountId, now, accountId, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Screening complete read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'screening.complete');
      }
    },

    async cancel(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Screening not found');
        }
        if (existing.status === 'completed') {
          throw new RepositoryError('conflict', 'Completed screening cannot be cancelled');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE screenings SET
            status = 'cancelled',
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, accountId, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Screening cancel read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'screening.cancel');
      }
    },
  };
}
