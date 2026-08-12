import type { Encounter } from '../../domain/entities/entities';
import { ENCOUNTER_STATUSES, ENCOUNTER_TYPES, isOneOf } from '../../domain/enums/domainEnums';
import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  CreateDraftEncounterInput,
  EncounterRepository,
  TouchDraftEncounterInput,
} from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import {
  mapMetadata,
  newMetadataValues,
  optionalEntityId,
  type MetadataRow,
} from './rowHelpers';

type EncounterRow = MetadataRow & {
  client_id: string;
  encounter_type: string;
  occurred_at: string | null;
  facility_id: string | null;
  worker_account_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  draft_saved_at: string | null;
  source: string | null;
  notes: string | null;
};

function mapEncounter(row: EncounterRow): Encounter {
  const meta = mapMetadata(row);
  if (!isOneOf(row.encounter_type, ENCOUNTER_TYPES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid encounter type');
  }
  if (!isOneOf(row.status, ENCOUNTER_STATUSES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid encounter status');
  }
  return {
    ...meta,
    clientId: assertEntityId(row.client_id),
    encounterType: row.encounter_type,
    occurredAt: row.occurred_at,
    facilityId: optionalEntityId(row.facility_id),
    // Dev auth may store opaque worker ids (e.g. "dev-dual-…"); coerce on read-back.
    workerAccountId: optionalEntityId(row.worker_account_id),
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    draftSavedAt: row.draft_saved_at,
    source: row.source,
    notes: row.notes,
  };
}

export function createSqliteEncounterRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): EncounterRepository {
  return {
    async createDraft(input: CreateDraftEncounterInput): Promise<Encounter> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO encounters (
            id, client_id, encounter_type, occurred_at, facility_id, worker_account_id,
            status, started_at, completed_at, draft_saved_at, source, notes,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, NULL, ?, 'local', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.clientId,
            input.encounterType,
            null,
            input.facilityId ?? null,
            input.workerAccountId ?? null,
            meta.created_at,
            meta.created_at,
            input.notes ?? null,
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
          throw new RepositoryError('unknown', 'Encounter create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.createDraft');
      }
    },

    async findDraftById(id) {
      const encounter = await this.findById(id);
      if (!encounter || encounter.status !== 'draft') {
        return null;
      }
      return encounter;
    },

    async findActiveDraftByClient(clientId) {
      try {
        const row = await db.getFirstAsync<EncounterRow>(
          `SELECT * FROM encounters
           WHERE client_id = ?
             AND status IN ('draft', 'inProgress')
             AND is_deleted = 0
           ORDER BY updated_at DESC
           LIMIT 1`,
          [clientId],
        );
        return row ? mapEncounter(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.findActiveDraftByClient');
      }
    },

    async findById(id, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<EncounterRow>(
          `SELECT * FROM encounters WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [id],
        );
        return row ? mapEncounter(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.findById');
      }
    },

    async listByClient(clientId, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const rows = await db.getAllAsync<EncounterRow>(
          `SELECT * FROM encounters
           WHERE client_id = ?
           ${includeDeleted ? '' : 'AND is_deleted = 0'}
           ORDER BY created_at DESC`,
          [clientId],
        );
        return rows.map(mapEncounter);
      } catch (error) {
        throw mapSqliteError(error, 'encounter.listByClient');
      }
    },

    async touchDraftSaved(input: TouchDraftEncounterInput) {
      try {
        const existing = await this.findById(input.id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Encounter not found');
        }
        if (existing.status !== 'draft' && existing.status !== 'inProgress') {
          throw new RepositoryError('conflict', 'Only open visits can be draft-saved');
        }
        const now = clock.nowIso();
        const progressMarker =
          input.progressSectionId == null || input.progressSectionId === ''
            ? existing.notes
            : `nc_progress:${input.progressSectionId}`;
        await db.runAsync(
          `UPDATE encounters SET
            draft_saved_at = ?, notes = ?,
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, progressMarker, now, input.accountId ?? null, input.id],
        );
        const updated = await this.findById(input.id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Encounter draft save read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.touchDraftSaved');
      }
    },

    async appendControlledVisitNote(input) {
      try {
        const existing = await this.findById(input.id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Encounter not found');
        }
        if (existing.status !== 'draft' && existing.status !== 'inProgress') {
          throw new RepositoryError('conflict', 'Only open visits can receive voice notes');
        }
        const trimmed = input.noteText.trim();
        if (!trimmed) {
          throw new RepositoryError('validation', 'Visit note text is required');
        }
        const now = clock.nowIso();
        const marker = `nc_voice_note:${trimmed}`;
        const nextNotes =
          existing.notes == null || existing.notes === ''
            ? marker
            : `${existing.notes}\n${marker}`;
        await db.runAsync(
          `UPDATE encounters SET
            notes = ?, draft_saved_at = ?,
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [nextNotes, now, now, input.accountId ?? null, input.id],
        );
        const updated = await this.findById(input.id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Encounter note read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.appendControlledVisitNote');
      }
    },

    async markInProgress(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Encounter not found');
        }
        if (existing.status === 'completed' || existing.status === 'cancelled') {
          throw new RepositoryError('conflict', 'Closed encounter cannot become inProgress');
        }
        if (existing.status === 'inProgress') {
          return existing;
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE encounters SET
            status = 'inProgress',
            started_at = COALESCE(started_at, ?),
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, now, accountId, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Encounter markInProgress read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.markInProgress');
      }
    },

    async complete(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Encounter not found');
        }
        if (existing.status === 'completed') {
          return existing;
        }
        if (existing.status === 'cancelled') {
          throw new RepositoryError('conflict', 'Cancelled encounter cannot be completed');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE encounters SET
            status = 'completed', completed_at = ?, occurred_at = COALESCE(occurred_at, ?),
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, now, now, accountId, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Encounter complete read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.complete');
      }
    },

    async cancel(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Encounter not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE encounters SET
            status = 'cancelled', updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, accountId, id],
        );
        const updated = await this.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Encounter cancel read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'encounter.cancel');
      }
    },
  };
}
