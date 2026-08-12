import { isAgeUnit } from '../../domain/enums/ageUnit';
import { isClientCategory } from '../../domain/enums/clientCategory';
import { isOneOf, CONSENT_STATUSES } from '../../domain/enums/domainEnums';
import type { Client } from '../../domain/entities/entities';
import { normalizeSearchText } from '../../domain/validation/normalizeSearch';
import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import { assertDateOnly } from '../../domain/value-objects/dateOnly';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  ClientRepository,
  CreateClientInput,
  ListClientsOptions,
  UpdateClientInput,
} from '../contracts/types';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import { mapMetadata, newMetadataValues, type MetadataRow } from './rowHelpers';

type ClientRow = MetadataRow & {
  client_code: string;
  category: string;
  given_name: string;
  family_name: string;
  preferred_name: string | null;
  sex: string | null;
  date_of_birth: string | null;
  approximate_age: number | null;
  approximate_age_unit: string | null;
  pregnancy_status: string | null;
  estimated_delivery_date: string | null;
  phone_number: string | null;
  community: string | null;
  district: string | null;
  region: string | null;
  primary_facility_id: string | null;
  consent_status: string;
  consent_recorded_at: string | null;
  notes: string | null;
  search_normalized: string;
};

function mapClient(row: ClientRow): Client {
  const meta = mapMetadata(row);
  if (!isClientCategory(row.category)) {
    throw new RepositoryError('dataIntegrity', 'Invalid client category');
  }
  if (!isOneOf(row.consent_status, CONSENT_STATUSES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid consent status');
  }
  if (
    row.approximate_age_unit != null &&
    !isAgeUnit(row.approximate_age_unit)
  ) {
    throw new RepositoryError('dataIntegrity', 'Invalid approximate age unit');
  }
  return {
    ...meta,
    clientCode: row.client_code,
    category: row.category,
    givenName: row.given_name,
    familyName: row.family_name,
    preferredName: row.preferred_name,
    sex: row.sex,
    dateOfBirth: row.date_of_birth ? assertDateOnly(row.date_of_birth) : null,
    approximateAge: row.approximate_age,
    approximateAgeUnit: row.approximate_age_unit,
    pregnancyStatus: row.pregnancy_status,
    estimatedDeliveryDate: row.estimated_delivery_date
      ? assertDateOnly(row.estimated_delivery_date)
      : null,
    phoneNumber: row.phone_number,
    community: row.community,
    district: row.district,
    region: row.region,
    primaryFacilityId: row.primary_facility_id
      ? assertEntityId(row.primary_facility_id)
      : null,
    consentStatus: row.consent_status,
    consentRecordedAt: row.consent_recorded_at,
    notes: row.notes,
    searchNormalized: row.search_normalized,
  };
}

function assertAgeXorDob(input: {
  readonly dateOfBirth?: string | null;
  readonly approximateAge?: number | null;
  readonly approximateAgeUnit?: string | null;
}): void {
  const hasDob =
    input.dateOfBirth != null && String(input.dateOfBirth).trim().length > 0;
  const hasAge = input.approximateAge != null;
  if (hasDob && hasAge) {
    throw new RepositoryError(
      'validation',
      'Provide either date of birth or approximate age, not both',
    );
  }
  if (hasAge) {
    if (input.approximateAge != null && input.approximateAge < 0) {
      throw new RepositoryError('validation', 'Approximate age must be non-negative');
    }
    if (!isAgeUnit(input.approximateAgeUnit)) {
      throw new RepositoryError('validation', 'Approximate age unit is required');
    }
  }
  if (!hasAge && input.approximateAgeUnit != null) {
    throw new RepositoryError(
      'validation',
      'Approximate age unit requires an approximate age value',
    );
  }
}

export function createSqliteClientRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): ClientRepository {
  return {
    async create(input: CreateClientInput): Promise<Client> {
      try {
        if (!input.clientCode.trim()) {
          throw new RepositoryError('validation', 'clientCode is required');
        }
        if (!input.givenName.trim() || !input.familyName.trim()) {
          throw new RepositoryError('validation', 'givenName and familyName are required');
        }
        if (!isClientCategory(input.category)) {
          throw new RepositoryError('validation', 'Invalid client category');
        }
        const consentStatus = input.consentStatus ?? 'unknown';
        if (!isOneOf(consentStatus, CONSENT_STATUSES)) {
          throw new RepositoryError('validation', 'Invalid consent status');
        }
        assertAgeXorDob(input);
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        const searchNormalized = normalizeSearchText(
          `${input.givenName} ${input.familyName} ${input.preferredName ?? ''}`,
        );
        const consentRecordedAt =
          consentStatus === 'recorded' ? meta.created_at : null;
        await db.runAsync(
          `INSERT INTO clients (
            id, client_code, category, given_name, family_name, preferred_name, sex,
            date_of_birth, approximate_age, approximate_age_unit, pregnancy_status, estimated_delivery_date,
            phone_number, community, district, region, primary_facility_id,
            consent_status, consent_recorded_at, notes, search_normalized,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.clientCode.trim(),
            input.category,
            input.givenName.trim(),
            input.familyName.trim(),
            input.preferredName ?? null,
            input.sex ?? null,
            input.dateOfBirth ?? null,
            input.approximateAge ?? null,
            input.approximateAgeUnit ?? null,
            input.pregnancyStatus ?? null,
            input.estimatedDeliveryDate ?? null,
            input.phoneNumber ?? null,
            input.community ?? null,
            input.district ?? null,
            input.region ?? null,
            input.primaryFacilityId ?? null,
            consentStatus,
            consentRecordedAt,
            input.notes ?? null,
            searchNormalized,
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
          throw new RepositoryError('unknown', 'Client create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'client.create');
      }
    },

    async findById(id, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<ClientRow>(
          `SELECT * FROM clients WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [id],
        );
        return row ? mapClient(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'client.findById');
      }
    },

    async findByClientCode(clientCode, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<ClientRow>(
          `SELECT * FROM clients WHERE client_code = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [clientCode],
        );
        return row ? mapClient(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'client.findByClientCode');
      }
    },

    async search(query, options = {}) {
      return this.list({ ...options, query });
    },

    async list(options: ListClientsOptions = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const clauses: string[] = [];
        const params: unknown[] = [];
        if (!includeDeleted) {
          clauses.push('is_deleted = 0');
        }
        if (options.query != null && options.query.trim().length > 0) {
          clauses.push('search_normalized LIKE ?');
          params.push(`%${normalizeSearchText(options.query)}%`);
        }
        if (options.category) {
          clauses.push('category = ?');
          params.push(options.category);
        }
        if (options.facilityId) {
          clauses.push('primary_facility_id = ?');
          params.push(options.facilityId);
        }
        const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        const rows = await db.getAllAsync<ClientRow>(
          `SELECT * FROM clients
           ${where}
           ORDER BY family_name ASC, given_name ASC`,
          params,
        );
        return rows.map(mapClient);
      } catch (error) {
        throw mapSqliteError(error, 'client.list');
      }
    },

    async update(input: UpdateClientInput) {
      try {
        const existing = await this.findById(input.id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Client not found');
        }
        if (
          input.expectedLocalVersion != null &&
          existing.localVersion !== input.expectedLocalVersion
        ) {
          throw new RepositoryError(
            'conflict',
            'Client record changed since it was loaded',
            {
              expected: input.expectedLocalVersion,
              actual: existing.localVersion,
            },
          );
        }

        const givenName = input.givenName ?? existing.givenName;
        const familyName = input.familyName ?? existing.familyName;
        const preferredName =
          input.preferredName !== undefined ? input.preferredName : existing.preferredName;
        const dateOfBirth =
          input.dateOfBirth !== undefined ? input.dateOfBirth : existing.dateOfBirth;
        const approximateAge =
          input.approximateAge !== undefined
            ? input.approximateAge
            : existing.approximateAge;
        const approximateAgeUnit =
          input.approximateAgeUnit !== undefined
            ? input.approximateAgeUnit
            : existing.approximateAgeUnit;
        assertAgeXorDob({
          dateOfBirth,
          approximateAge,
          approximateAgeUnit,
        });

        const consentStatus =
          input.consentStatus !== undefined
            ? input.consentStatus
            : existing.consentStatus;
        if (!isOneOf(consentStatus, CONSENT_STATUSES)) {
          throw new RepositoryError('validation', 'Invalid consent status');
        }
        const now = clock.nowIso();
        let consentRecordedAt = existing.consentRecordedAt;
        if (consentStatus === 'recorded' && existing.consentStatus !== 'recorded') {
          consentRecordedAt = now;
        }
        if (consentStatus !== 'recorded') {
          consentRecordedAt = consentStatus === existing.consentStatus
            ? existing.consentRecordedAt
            : null;
        }

        const searchNormalized = normalizeSearchText(
          `${givenName} ${familyName} ${preferredName ?? ''}`,
        );
        await db.runAsync(
          `UPDATE clients SET
            given_name = ?, family_name = ?, preferred_name = ?, category = ?, sex = ?,
            date_of_birth = ?, approximate_age = ?, approximate_age_unit = ?,
            phone_number = ?, community = ?, district = ?, region = ?,
            primary_facility_id = ?,
            pregnancy_status = ?, estimated_delivery_date = ?,
            consent_status = ?, consent_recorded_at = ?, notes = ?,
            search_normalized = ?, updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [
            givenName,
            familyName,
            preferredName,
            input.category ?? existing.category,
            input.sex !== undefined ? input.sex : existing.sex,
            dateOfBirth,
            approximateAge,
            approximateAgeUnit,
            input.phoneNumber !== undefined ? input.phoneNumber : existing.phoneNumber,
            input.community !== undefined ? input.community : existing.community,
            input.district !== undefined ? input.district : existing.district,
            input.region !== undefined ? input.region : existing.region,
            input.primaryFacilityId !== undefined
              ? input.primaryFacilityId
              : existing.primaryFacilityId,
            input.pregnancyStatus !== undefined
              ? input.pregnancyStatus
              : existing.pregnancyStatus,
            input.estimatedDeliveryDate !== undefined
              ? input.estimatedDeliveryDate
              : existing.estimatedDeliveryDate,
            consentStatus,
            consentRecordedAt,
            input.notes !== undefined ? input.notes : existing.notes,
            searchNormalized,
            now,
            input.accountId ?? null,
            input.id,
          ],
        );
        const updated = await this.findById(input.id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Client not found after update');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'client.update');
      }
    },

    async archive(id, accountId = null) {
      try {
        const existing = await this.findById(id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Client not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE clients SET
            is_deleted = 1, deleted_at = ?, updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingDelete'
           WHERE id = ? AND is_deleted = 0`,
          [now, now, accountId, id],
        );
        const archived = await this.findById(id, { includeDeleted: true });
        if (!archived) {
          throw new RepositoryError('unknown', 'Client archive read-back failed');
        }
        return archived;
      } catch (error) {
        throw mapSqliteError(error, 'client.archive');
      }
    },

    async listByFacility(facilityId, options = {}) {
      return this.list({ ...options, facilityId });
    },
  };
}
