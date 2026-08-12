import type { ReferralPassport } from '../../domain/entities/entities';
import {
  isOneOf,
  REFERRAL_PASSPORT_STATUSES,
} from '../../domain/enums/domainEnums';
import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  CreateReferralPassportInput,
  ReferralPassportRepository,
} from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import { mapMetadata, newMetadataValues, type MetadataRow } from './rowHelpers';

type PassportRow = MetadataRow & {
  referral_id: string;
  token_hash: string;
  status: string;
  payload_version: number;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  superseded_by_passport_id: string | null;
};

function mapPassport(row: PassportRow): ReferralPassport {
  const meta = mapMetadata(row);
  if (!isOneOf(row.status, REFERRAL_PASSPORT_STATUSES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid referral passport status');
  }
  return {
    ...meta,
    referralId: assertEntityId(row.referral_id),
    tokenHash: row.token_hash,
    status: row.status,
    payloadVersion: row.payload_version,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
    supersededByPassportId: row.superseded_by_passport_id
      ? assertEntityId(row.superseded_by_passport_id)
      : null,
  };
}

export function createSqliteReferralPassportRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): ReferralPassportRepository {
  const repo: ReferralPassportRepository = {
    async create(input: CreateReferralPassportInput): Promise<ReferralPassport> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        const issuedAt = input.issuedAt ?? meta.created_at;
        await db.runAsync(
          `INSERT INTO referral_passports (
            id, referral_id, token_hash, status, payload_version, issued_at, expires_at,
            revoked_at, revoked_reason, superseded_by_passport_id,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, 'active', ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.referralId,
            input.tokenHash,
            input.payloadVersion ?? 1,
            issuedAt,
            input.expiresAt ?? null,
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
        const created = await repo.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Passport create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.create');
      }
    },

    async findById(id) {
      try {
        const row = await db.getFirstAsync<PassportRow>(
          `SELECT * FROM referral_passports WHERE id = ? AND is_deleted = 0`,
          [id],
        );
        return row ? mapPassport(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.findById');
      }
    },

    async findActiveByReferralId(referralId) {
      try {
        const row = await db.getFirstAsync<PassportRow>(
          `SELECT * FROM referral_passports
           WHERE referral_id = ? AND status = 'active' AND is_deleted = 0
           ORDER BY issued_at DESC LIMIT 1`,
          [referralId],
        );
        return row ? mapPassport(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.findActiveByReferralId');
      }
    },

    async findByTokenHash(tokenHash) {
      try {
        const row = await db.getFirstAsync<PassportRow>(
          `SELECT * FROM referral_passports
           WHERE token_hash = ? AND is_deleted = 0
           ORDER BY issued_at DESC LIMIT 1`,
          [tokenHash],
        );
        return row ? mapPassport(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.findByTokenHash');
      }
    },

    async listByReferralId(referralId) {
      try {
        const rows = await db.getAllAsync<PassportRow>(
          `SELECT * FROM referral_passports
           WHERE referral_id = ? AND is_deleted = 0
           ORDER BY issued_at DESC`,
          [referralId],
        );
        return rows.map(mapPassport);
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.listByReferralId');
      }
    },

    async revoke({ id, reason, accountId = null }) {
      try {
        const existing = await repo.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Passport not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE referral_passports SET
            status = 'revoked', revoked_at = ?, revoked_reason = ?,
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, reason, now, accountId, id],
        );
        const updated = await repo.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Passport revoke read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.revoke');
      }
    },

    async markSuperseded({ id, supersededByPassportId, accountId = null }) {
      try {
        const existing = await repo.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Passport not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE referral_passports SET
            status = 'superseded', superseded_by_passport_id = ?,
            revoked_at = COALESCE(revoked_at, ?),
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [supersededByPassportId, now, now, accountId, id],
        );
        const updated = await repo.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Passport supersede read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.markSuperseded');
      }
    },

    async markExpired(id, accountId = null) {
      try {
        const existing = await repo.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Passport not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE referral_passports SET
            status = 'expired', updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, accountId, id],
        );
        const updated = await repo.findById(id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Passport expire read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'referralPassport.markExpired');
      }
    },
  };

  return repo;
}
