import type { Referral, ReferralEvent } from '../../domain/entities/entities';
import {
  isOneOf,
  REFERRAL_ORIGINS,
  REFERRAL_PRIORITY_SOURCES,
  REFERRAL_STATUSES,
  RISK_PRIORITIES,
  TRANSPORT_STATUSES,
} from '../../domain/enums/domainEnums';
import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  AddReferralEventInput,
  CreateReferralDraftInput,
  ReferralRepository,
  UpdateReferralDraftInput,
} from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import {
  boolToInt,
  intToBool,
  mapMetadata,
  newMetadataValues,
  optionalEntityId,
  type MetadataRow,
} from './rowHelpers';

type ReferralRow = MetadataRow & {
  client_id: string;
  encounter_id: string | null;
  risk_assessment_id: string | null;
  source_facility_id: string | null;
  receiving_facility_id: string | null;
  priority: string;
  reason_summary: string | null;
  transport_status: string;
  caregiver_informed: number;
  status: string;
  completed_at: string | null;
  qr_payload_version: number | null;
  reference_code: string | null;
  origin: string;
  reason_code: string | null;
  reason_content_status: string | null;
  priority_source: string;
  communication_notes: string | null;
  worker_notes: string | null;
  active_passport_id: string | null;
};

type EventRow = MetadataRow & {
  referral_id: string;
  event_type: string;
  occurred_at: string;
  recorded_by_account_id: string | null;
  facility_id: string | null;
  notes: string | null;
};

function mapReferral(row: ReferralRow): Referral {
  const meta = mapMetadata(row);
  if (!isOneOf(row.priority, RISK_PRIORITIES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid referral priority');
  }
  if (!isOneOf(row.status, REFERRAL_STATUSES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid referral status');
  }
  if (!isOneOf(row.transport_status, TRANSPORT_STATUSES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid transport status');
  }
  const origin =
    row.origin && isOneOf(row.origin, REFERRAL_ORIGINS) ? row.origin : 'workerInitiated';
  const prioritySource =
    row.priority_source && isOneOf(row.priority_source, REFERRAL_PRIORITY_SOURCES)
      ? row.priority_source
      : 'noEnginePriority';
  return {
    ...meta,
    clientId: assertEntityId(row.client_id),
    encounterId: row.encounter_id ? assertEntityId(row.encounter_id) : null,
    riskAssessmentId: row.risk_assessment_id
      ? assertEntityId(row.risk_assessment_id)
      : null,
    // Opaque facility codes (e.g. fac-dev-001) must not crash read-back;
    // writers resolve assigned facilities to local UUIDs before insert.
    sourceFacilityId: optionalEntityId(row.source_facility_id),
    receivingFacilityId: optionalEntityId(row.receiving_facility_id),
    priority: row.priority,
    reasonSummary: row.reason_summary,
    transportStatus: row.transport_status,
    caregiverInformed: intToBool(row.caregiver_informed),
    status: row.status,
    completedAt: row.completed_at,
    qrPayloadVersion: row.qr_payload_version,
    referenceCode: row.reference_code,
    origin,
    reasonCode: row.reason_code,
    reasonContentStatus: row.reason_content_status,
    prioritySource,
    communicationNotes: row.communication_notes,
    workerNotes: row.worker_notes,
    activePassportId: row.active_passport_id
      ? assertEntityId(row.active_passport_id)
      : null,
  };
}

function mapEvent(row: EventRow): ReferralEvent {
  const meta = mapMetadata(row);
  return {
    ...meta,
    referralId: assertEntityId(row.referral_id),
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    recordedByAccountId: optionalEntityId(row.recorded_by_account_id),
    facilityId: optionalEntityId(row.facility_id),
    notes: row.notes,
  };
}

export function createSqliteReferralRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): ReferralRepository {
  const repo: ReferralRepository = {
    async createDraft(input: CreateReferralDraftInput): Promise<Referral> {
      try {
        const actorId = optionalEntityId(input.accountId);
        const sourceFacilityId = optionalEntityId(input.sourceFacilityId);
        const receivingFacilityId = optionalEntityId(input.receivingFacilityId);
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: actorId,
          syncStatus: 'pendingCreate',
        });
        await db.withTransactionAsync(async () => {
          await db.runAsync(
            `INSERT INTO referrals (
              id, client_id, encounter_id, risk_assessment_id, source_facility_id,
              receiving_facility_id, priority, reason_summary, transport_status,
              caregiver_informed, status, completed_at, qr_payload_version,
              reference_code, origin, reason_code, reason_content_status, priority_source,
              communication_notes, worker_notes, active_passport_id,
              created_at, updated_at, created_by_account_id, updated_by_account_id,
              local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'draft', NULL, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              meta.id,
              input.clientId,
              input.encounterId ?? null,
              input.riskAssessmentId ?? null,
              sourceFacilityId,
              receivingFacilityId,
              input.priority,
              input.reasonSummary ?? null,
              input.transportStatus ?? 'unknown',
              input.referenceCode ?? null,
              input.origin ?? 'workerInitiated',
              input.reasonCode ?? null,
              input.reasonContentStatus ?? null,
              input.prioritySource ?? 'noEnginePriority',
              input.communicationNotes ?? null,
              input.workerNotes ?? null,
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
          const eventMeta = newMetadataValues({
            id: ids.nextId(),
            now: meta.created_at,
            accountId: actorId,
          });
          await db.runAsync(
            `INSERT INTO referral_events (
              id, referral_id, event_type, occurred_at, recorded_by_account_id,
              facility_id, notes,
              created_at, updated_at, created_by_account_id, updated_by_account_id,
              local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
            ) VALUES (?, ?, 'draft_created', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              eventMeta.id,
              meta.id,
              meta.created_at,
              actorId,
              sourceFacilityId,
              eventMeta.created_at,
              eventMeta.updated_at,
              eventMeta.created_by_account_id,
              eventMeta.updated_by_account_id,
              eventMeta.local_version,
              eventMeta.server_version,
              eventMeta.sync_status,
              eventMeta.last_synced_at,
              eventMeta.deleted_at,
              eventMeta.is_deleted,
            ],
          );
        });
        const created = await repo.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Referral create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'referral.createDraft');
      }
    },

    async updateDraft(input: UpdateReferralDraftInput): Promise<Referral> {
      try {
        const existing = await repo.findById(input.id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Referral not found');
        }
        if (existing.status !== 'draft') {
          throw new RepositoryError('constraint', 'Only draft referrals can be updated as drafts');
        }
        const now = clock.nowIso();
        const actorId = optionalEntityId(input.accountId);
        const receivingFacilityId =
          input.receivingFacilityId === undefined
            ? undefined
            : optionalEntityId(input.receivingFacilityId);
        await db.runAsync(
          `UPDATE referrals SET
            receiving_facility_id = COALESCE(?, receiving_facility_id),
            priority = COALESCE(?, priority),
            reason_summary = COALESCE(?, reason_summary),
            reason_code = COALESCE(?, reason_code),
            reason_content_status = COALESCE(?, reason_content_status),
            communication_notes = COALESCE(?, communication_notes),
            worker_notes = COALESCE(?, worker_notes),
            transport_status = COALESCE(?, transport_status),
            caregiver_informed = COALESCE(?, caregiver_informed),
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [
            receivingFacilityId === undefined ? null : receivingFacilityId,
            input.priority ?? null,
            input.reasonSummary === undefined ? null : input.reasonSummary,
            input.reasonCode === undefined ? null : input.reasonCode,
            input.reasonContentStatus === undefined ? null : input.reasonContentStatus,
            input.communicationNotes === undefined ? null : input.communicationNotes,
            input.workerNotes === undefined ? null : input.workerNotes,
            input.transportStatus ?? null,
            input.caregiverInformed === undefined
              ? null
              : boolToInt(input.caregiverInformed),
            now,
            actorId,
            input.id,
          ],
        );
        // COALESCE cannot clear nullable fields when undefined means "leave alone".
        // Re-apply explicit nullable clears when callers pass null.
        if (
          input.receivingFacilityId === null ||
          input.reasonSummary === null ||
          input.reasonCode === null ||
          input.reasonContentStatus === null ||
          input.communicationNotes === null ||
          input.workerNotes === null
        ) {
          await db.runAsync(
            `UPDATE referrals SET
              receiving_facility_id = CASE WHEN ? THEN NULL ELSE receiving_facility_id END,
              reason_summary = CASE WHEN ? THEN NULL ELSE reason_summary END,
              reason_code = CASE WHEN ? THEN NULL ELSE reason_code END,
              reason_content_status = CASE WHEN ? THEN NULL ELSE reason_content_status END,
              communication_notes = CASE WHEN ? THEN NULL ELSE communication_notes END,
              worker_notes = CASE WHEN ? THEN NULL ELSE worker_notes END
             WHERE id = ? AND is_deleted = 0`,
            [
              input.receivingFacilityId === null ? 1 : 0,
              input.reasonSummary === null ? 1 : 0,
              input.reasonCode === null ? 1 : 0,
              input.reasonContentStatus === null ? 1 : 0,
              input.communicationNotes === null ? 1 : 0,
              input.workerNotes === null ? 1 : 0,
              input.id,
            ],
          );
        }
        const updated = await repo.findById(input.id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Referral draft update read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referral.updateDraft');
      }
    },

    async updateDetails(input: UpdateReferralDraftInput): Promise<Referral> {
      const EDITABLE = new Set([
        'created',
        'caregiverInformed',
        'journeyStarted',
        'facilityReached',
        'patientReceived',
        'overdue',
      ]);
      try {
        const existing = await repo.findById(input.id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Referral not found');
        }
        if (existing.status === 'draft') {
          throw new RepositoryError('constraint', 'Use updateDraft for draft referrals');
        }
        if (!EDITABLE.has(existing.status)) {
          throw new RepositoryError(
            'constraint',
            'This referral cannot be edited in its current status',
          );
        }
        const now = clock.nowIso();
        const actorId = optionalEntityId(input.accountId);
        const receivingFacilityId =
          input.receivingFacilityId === undefined
            ? undefined
            : optionalEntityId(input.receivingFacilityId);
        await db.withTransactionAsync(async () => {
          await db.runAsync(
            `UPDATE referrals SET
              receiving_facility_id = COALESCE(?, receiving_facility_id),
              priority = COALESCE(?, priority),
              reason_summary = COALESCE(?, reason_summary),
              reason_code = COALESCE(?, reason_code),
              reason_content_status = COALESCE(?, reason_content_status),
              communication_notes = COALESCE(?, communication_notes),
              worker_notes = COALESCE(?, worker_notes),
              transport_status = COALESCE(?, transport_status),
              caregiver_informed = COALESCE(?, caregiver_informed),
              updated_at = ?, updated_by_account_id = ?,
              local_version = local_version + 1, sync_status = 'pendingUpdate'
             WHERE id = ? AND is_deleted = 0`,
            [
              receivingFacilityId === undefined ? null : receivingFacilityId,
              input.priority ?? null,
              input.reasonSummary === undefined ? null : input.reasonSummary,
              input.reasonCode === undefined ? null : input.reasonCode,
              input.reasonContentStatus === undefined ? null : input.reasonContentStatus,
              input.communicationNotes === undefined ? null : input.communicationNotes,
              input.workerNotes === undefined ? null : input.workerNotes,
              input.transportStatus ?? null,
              input.caregiverInformed === undefined
                ? null
                : boolToInt(input.caregiverInformed),
              now,
              actorId,
              input.id,
            ],
          );
          if (
            input.receivingFacilityId === null ||
            input.reasonSummary === null ||
            input.reasonCode === null ||
            input.reasonContentStatus === null ||
            input.communicationNotes === null ||
            input.workerNotes === null
          ) {
            await db.runAsync(
              `UPDATE referrals SET
                receiving_facility_id = CASE WHEN ? THEN NULL ELSE receiving_facility_id END,
                reason_summary = CASE WHEN ? THEN NULL ELSE reason_summary END,
                reason_code = CASE WHEN ? THEN NULL ELSE reason_code END,
                reason_content_status = CASE WHEN ? THEN NULL ELSE reason_content_status END,
                communication_notes = CASE WHEN ? THEN NULL ELSE communication_notes END,
                worker_notes = CASE WHEN ? THEN NULL ELSE worker_notes END
               WHERE id = ? AND is_deleted = 0`,
              [
                input.receivingFacilityId === null ? 1 : 0,
                input.reasonSummary === null ? 1 : 0,
                input.reasonCode === null ? 1 : 0,
                input.reasonContentStatus === null ? 1 : 0,
                input.communicationNotes === null ? 1 : 0,
                input.workerNotes === null ? 1 : 0,
                input.id,
              ],
            );
          }
          const eventMeta = newMetadataValues({
            id: ids.nextId(),
            now,
            accountId: actorId,
          });
          await db.runAsync(
            `INSERT INTO referral_events (
              id, referral_id, event_type, occurred_at, recorded_by_account_id,
              facility_id, notes,
              created_at, updated_at, created_by_account_id, updated_by_account_id,
              local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              eventMeta.id,
              input.id,
              'referral_edited',
              now,
              actorId,
              eventMeta.created_at,
              eventMeta.updated_at,
              eventMeta.created_by_account_id,
              eventMeta.updated_by_account_id,
              eventMeta.local_version,
              eventMeta.server_version,
              eventMeta.sync_status,
              eventMeta.last_synced_at,
              eventMeta.deleted_at,
              eventMeta.is_deleted,
            ],
          );
        });
        const updated = await repo.findById(input.id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Referral update read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referral.updateDetails');
      }
    },

    async addEvent(input: AddReferralEventInput): Promise<ReferralEvent> {
      try {
        const referral = await repo.findById(input.referralId);
        if (!referral) {
          throw new RepositoryError('notFound', 'Referral not found');
        }
        const actorId = optionalEntityId(input.accountId);
        const facilityId = optionalEntityId(input.facilityId);
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: actorId,
          syncStatus: 'pendingCreate',
        });
        const occurredAt = input.occurredAt ?? meta.created_at;
        await db.runAsync(
          `INSERT INTO referral_events (
            id, referral_id, event_type, occurred_at, recorded_by_account_id,
            facility_id, notes,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.referralId,
            input.eventType,
            occurredAt,
            actorId,
            facilityId,
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
        const row = await db.getFirstAsync<EventRow>(
          `SELECT * FROM referral_events WHERE id = ?`,
          [meta.id],
        );
        if (!row) {
          throw new RepositoryError('unknown', 'Referral event read-back failed');
        }
        return mapEvent(row);
      } catch (error) {
        throw mapSqliteError(error, 'referral.addEvent');
      }
    },

    async updateStatus(id, status, accountId = null, options = {}) {
      try {
        const existing = await repo.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Referral not found');
        }
        const now = clock.nowIso();
        const actorId = optionalEntityId(accountId);
        const apply = async () => {
          await db.runAsync(
            `UPDATE referrals SET
              status = ?, updated_at = ?, updated_by_account_id = ?,
              completed_at = CASE WHEN ? IN ('completed', 'cancelled') THEN ? ELSE completed_at END,
              caregiver_informed = CASE WHEN ? = 'caregiverInformed' THEN 1 ELSE caregiver_informed END,
              local_version = local_version + 1, sync_status = 'pendingUpdate'
             WHERE id = ? AND is_deleted = 0`,
            [status, now, actorId, status, now, status, id],
          );
          const eventMeta = newMetadataValues({
            id: ids.nextId(),
            now,
            accountId: actorId,
          });
          await db.runAsync(
            `INSERT INTO referral_events (
              id, referral_id, event_type, occurred_at, recorded_by_account_id,
              facility_id, notes,
              created_at, updated_at, created_by_account_id, updated_by_account_id,
              local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              eventMeta.id,
              id,
              `status_${status}`,
              now,
              actorId,
              eventMeta.created_at,
              eventMeta.updated_at,
              eventMeta.created_by_account_id,
              eventMeta.updated_by_account_id,
              eventMeta.local_version,
              eventMeta.server_version,
              eventMeta.sync_status,
              eventMeta.last_synced_at,
              eventMeta.deleted_at,
              eventMeta.is_deleted,
            ],
          );
        };
        if (options.alreadyInTransaction) {
          await apply();
        } else {
          await db.withTransactionAsync(apply);
        }
        const updated = await repo.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Referral status read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referral.updateStatus');
      }
    },

    async setActivePassport(id, passportId, qrPayloadVersion, accountId = null) {
      try {
        const existing = await repo.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Referral not found');
        }
        const now = clock.nowIso();
        const actorId = optionalEntityId(accountId);
        await db.runAsync(
          `UPDATE referrals SET
            active_passport_id = ?, qr_payload_version = ?,
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [passportId, qrPayloadVersion, now, actorId, id],
        );
        const updated = await repo.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Referral passport link read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referral.setActivePassport');
      }
    },

    async findById(id, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<ReferralRow>(
          `SELECT * FROM referrals WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [id],
        );
        return row ? mapReferral(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'referral.findById');
      }
    },

    async findByReferenceCode(referenceCode) {
      try {
        const row = await db.getFirstAsync<ReferralRow>(
          `SELECT * FROM referrals
           WHERE reference_code = ? AND is_deleted = 0
           LIMIT 1`,
          [referenceCode],
        );
        return row ? mapReferral(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'referral.findByReferenceCode');
      }
    },

    async listByClient(clientId, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const rows = await db.getAllAsync<ReferralRow>(
          `SELECT * FROM referrals
           WHERE client_id = ?
           ${includeDeleted ? '' : 'AND is_deleted = 0'}
           ORDER BY updated_at DESC`,
          [clientId],
        );
        return rows.map(mapReferral);
      } catch (error) {
        throw mapSqliteError(error, 'referral.listByClient');
      }
    },

    async listPending() {
      try {
        const rows = await db.getAllAsync<ReferralRow>(
          `SELECT * FROM referrals
           WHERE is_deleted = 0
             AND status IN ('draft', 'created', 'caregiverInformed', 'journeyStarted', 'facilityReached', 'patientReceived')
           ORDER BY updated_at ASC`,
        );
        return rows.map(mapReferral);
      } catch (error) {
        throw mapSqliteError(error, 'referral.listPending');
      }
    },

    async listOverdue() {
      try {
        const rows = await db.getAllAsync<ReferralRow>(
          `SELECT * FROM referrals WHERE is_deleted = 0 AND status = 'overdue'
           ORDER BY updated_at ASC`,
        );
        return rows.map(mapReferral);
      } catch (error) {
        throw mapSqliteError(error, 'referral.listOverdue');
      }
    },

    async listRecent(limit = 50) {
      try {
        const rows = await db.getAllAsync<ReferralRow>(
          `SELECT * FROM referrals
           WHERE is_deleted = 0
           ORDER BY updated_at DESC
           LIMIT ?`,
          [limit],
        );
        return rows.map(mapReferral);
      } catch (error) {
        throw mapSqliteError(error, 'referral.listRecent');
      }
    },

    async listEvents(referralId) {
      try {
        const rows = await db.getAllAsync<EventRow>(
          `SELECT * FROM referral_events
           WHERE referral_id = ? AND is_deleted = 0
           ORDER BY occurred_at ASC, created_at ASC`,
          [referralId],
        );
        return rows.map(mapEvent);
      } catch (error) {
        throw mapSqliteError(error, 'referral.listEvents');
      }
    },

    async cancel(id, accountId = null) {
      return repo.updateStatus(id, 'cancelled', accountId);
    },
  };

  return repo;
}
