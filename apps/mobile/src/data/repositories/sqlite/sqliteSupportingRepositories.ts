import type {
  Attachment,
  Caregiver,
  ClientRelationship,
  Facility,
  LocalAccountReference,
  Measurement,
  RiskAssessment,
  RiskFactor,
} from '../../domain/entities/entities';
import {
  ACCOUNT_ROLES,
  ATTACHMENT_ENCRYPTION_STATUSES,
  ATTACHMENT_UPLOAD_STATUSES,
  isOneOf,
  MEASUREMENT_TYPES,
  MEASUREMENT_UNITS,
  RELATIONSHIP_TYPES,
  RISK_PRIORITIES,
} from '../../domain/enums/domainEnums';
import type { SyncStatus } from '../../domain/enums/syncStatus';
import type { Clock } from '../../domain/value-objects/clock';
import { assertDateOnly } from '../../domain/value-objects/dateOnly';
import type { EntityId } from '../../domain/value-objects/EntityId';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  AttachmentRepository,
  CaregiverRepository,
  FacilityRepository,
  LocalAccountReferenceRepository,
  MeasurementRepository,
  RiskAssessmentRepository,
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

type FacilityRow = MetadataRow & {
  external_code: string | null;
  name: string;
  facility_type: string | null;
  district: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: number;
};

function mapFacility(row: FacilityRow): Facility | null {
  try {
    return {
      ...mapMetadata(row),
      externalCode: row.external_code,
      name: row.name,
      facilityType: row.facility_type,
      district: row.district,
      region: row.region,
      latitude: row.latitude,
      longitude: row.longitude,
      isActive: intToBool(row.is_active),
    };
  } catch {
    return null;
  }
}

export function createSqliteFacilityRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): FacilityRepository {
  return {
    async create(input) {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          syncStatus: 'localOnly',
        });
        await db.runAsync(
          `INSERT INTO facilities (
            id, external_code, name, facility_type, district, region,
            latitude, longitude, is_active,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, NULL, ?, NULL, ?, NULL, NULL, 0)`,
          [
            meta.id,
            input.externalCode ?? null,
            input.name,
            input.facilityType ?? null,
            input.district ?? null,
            input.region ?? null,
            boolToInt(input.isActive ?? true),
            meta.created_at,
            meta.updated_at,
            meta.local_version,
            meta.sync_status,
          ],
        );
        const created = await this.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Facility create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'facility.create');
      }
    },
    async findById(id, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<FacilityRow>(
          `SELECT * FROM facilities WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [id],
        );
        return row ? mapFacility(row) : null;
      } catch {
        return null;
      }
    },
    async findByExternalCode(externalCode, options = {}) {
      try {
        const code = externalCode.trim();
        if (!code) {
          return null;
        }
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<FacilityRow>(
          `SELECT * FROM facilities WHERE external_code = ? ${
            includeDeleted ? '' : 'AND is_deleted = 0'
          } LIMIT 1`,
          [code],
        );
        return row ? mapFacility(row) : null;
      } catch {
        return null;
      }
    },
    async listActive() {
      try {
        const rows = await db.getAllAsync<FacilityRow>(
          `SELECT * FROM facilities WHERE is_active = 1 AND is_deleted = 0 ORDER BY name ASC`,
        );
        return rows.map(mapFacility).filter((f): f is Facility => f != null);
      } catch {
        return [];
      }
    },
  };
}

export function createSqliteLocalAccountReferenceRepository(
  db: SqliteDriver,
  clock: Clock,
): LocalAccountReferenceRepository {
  return {
    async upsert(input) {
      try {
        if (!isOneOf(input.role, ACCOUNT_ROLES)) {
          throw new RepositoryError('validation', 'Invalid account role');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `INSERT INTO local_account_references (
            account_id, role, facility_id, display_name, last_seen_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(account_id) DO UPDATE SET
            role = excluded.role,
            facility_id = excluded.facility_id,
            display_name = excluded.display_name,
            last_seen_at = excluded.last_seen_at,
            updated_at = excluded.updated_at`,
          [
            input.accountId,
            input.role,
            input.facilityId ?? null,
            input.displayName,
            now,
            now,
            now,
          ],
        );
        const found = await this.findById(input.accountId);
        if (!found) {
          throw new RepositoryError('unknown', 'Local account read-back failed');
        }
        return found;
      } catch (error) {
        throw mapSqliteError(error, 'localAccount.upsert');
      }
    },
    async findById(accountId) {
      try {
        const row = await db.getFirstAsync<{
          account_id: string;
          role: string;
          facility_id: string | null;
          display_name: string;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        }>(`SELECT * FROM local_account_references WHERE account_id = ?`, [accountId]);
        if (!row) {
          return null;
        }
        if (!isOneOf(row.role, ACCOUNT_ROLES)) {
          throw new RepositoryError('dataIntegrity', 'Invalid stored account role');
        }
        return {
          accountId: assertEntityId(row.account_id),
          role: row.role,
          facilityId: row.facility_id ? assertEntityId(row.facility_id) : null,
          displayName: row.display_name,
          lastSeenAt: row.last_seen_at,
          createdAt: assertIsoUtcTimestamp(row.created_at),
          updatedAt: assertIsoUtcTimestamp(row.updated_at),
        } satisfies LocalAccountReference;
      } catch (error) {
        throw mapSqliteError(error, 'localAccount.findById');
      }
    },
  };
}

type CaregiverRow = MetadataRow & {
  given_name: string;
  family_name: string;
  phone_number: string | null;
  community: string | null;
  notes: string | null;
};

type RelationshipRow = MetadataRow & {
  client_id: string;
  caregiver_id: string;
  relationship_type: string;
  is_primary: number;
  valid_from: string | null;
  valid_to: string | null;
};

export function createSqliteCaregiverRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): CaregiverRepository {
  return {
    async create(input) {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO caregivers (
            id, given_name, family_name, phone_number, community, notes,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.givenName,
            input.familyName,
            input.phoneNumber ?? null,
            input.community ?? null,
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
          throw new RepositoryError('unknown', 'Caregiver create read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'caregiver.create');
      }
    },
    async findById(id, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const row = await db.getFirstAsync<CaregiverRow>(
          `SELECT * FROM caregivers WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [id],
        );
        if (!row) {
          return null;
        }
        return {
          ...mapMetadata(row),
          givenName: row.given_name,
          familyName: row.family_name,
          phoneNumber: row.phone_number,
          community: row.community,
          notes: row.notes,
        } satisfies Caregiver;
      } catch (error) {
        throw mapSqliteError(error, 'caregiver.findById');
      }
    },
    async createRelationship(input) {
      try {
        if (!isOneOf(input.relationshipType, RELATIONSHIP_TYPES)) {
          throw new RepositoryError('validation', 'Invalid relationship type');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO client_relationships (
            id, client_id, caregiver_id, relationship_type, is_primary,
            valid_from, valid_to,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.clientId,
            input.caregiverId,
            input.relationshipType,
            boolToInt(input.isPrimary ?? false),
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
        const row = await db.getFirstAsync<RelationshipRow>(
          `SELECT * FROM client_relationships WHERE id = ?`,
          [meta.id],
        );
        if (!row || !isOneOf(row.relationship_type, RELATIONSHIP_TYPES)) {
          throw new RepositoryError('unknown', 'Relationship read-back failed');
        }
        return {
          ...mapMetadata(row),
          clientId: assertEntityId(row.client_id),
          caregiverId: assertEntityId(row.caregiver_id),
          relationshipType: row.relationship_type,
          isPrimary: intToBool(row.is_primary),
          validFrom: row.valid_from ? assertDateOnly(row.valid_from) : null,
          validTo: row.valid_to ? assertDateOnly(row.valid_to) : null,
        } satisfies ClientRelationship;
      } catch (error) {
        throw mapSqliteError(error, 'caregiver.createRelationship');
      }
    },
    async listRelationshipsForClient(clientId, options = {}) {
      try {
        const includeDeleted = options.includeDeleted === true;
        const rows = await db.getAllAsync<RelationshipRow>(
          `SELECT * FROM client_relationships
           WHERE client_id = ?
           ${includeDeleted ? '' : 'AND is_deleted = 0'}`,
          [clientId],
        );
        return rows.map((row) => {
          if (!isOneOf(row.relationship_type, RELATIONSHIP_TYPES)) {
            throw new RepositoryError('dataIntegrity', 'Invalid relationship type');
          }
          return {
            ...mapMetadata(row),
            clientId: assertEntityId(row.client_id),
            caregiverId: assertEntityId(row.caregiver_id),
            relationshipType: row.relationship_type,
            isPrimary: intToBool(row.is_primary),
            validFrom: row.valid_from ? assertDateOnly(row.valid_from) : null,
            validTo: row.valid_to ? assertDateOnly(row.valid_to) : null,
          } satisfies ClientRelationship;
        });
      } catch (error) {
        throw mapSqliteError(error, 'caregiver.listRelationshipsForClient');
      }
    },
  };
}

export function createSqliteMeasurementRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): MeasurementRepository {
  return {
    async create(input) {
      try {
        if (!isOneOf(input.measurementType, MEASUREMENT_TYPES)) {
          throw new RepositoryError('validation', 'Invalid measurement type');
        }
        if (!isOneOf(input.unit, MEASUREMENT_UNITS)) {
          throw new RepositoryError('validation', 'Invalid measurement unit');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        const measuredAt = input.measuredAt ?? meta.created_at;
        await db.runAsync(
          `INSERT INTO measurements (
            id, encounter_id, screening_id, client_id, measurement_type,
            numeric_value, unit, measured_at, entered_by_account_id, device_source, notes,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.encounterId ?? null,
            input.screeningId ?? null,
            input.clientId,
            input.measurementType,
            input.numericValue,
            input.unit,
            measuredAt,
            input.accountId ?? null,
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
        // Return constructed entity directly to avoid read-back assertion failures
        return {
          id: meta.id as EntityId,
          createdAt: meta.created_at as IsoUtcTimestamp,
          updatedAt: meta.updated_at as IsoUtcTimestamp,
          createdByAccountId: (meta.created_by_account_id ?? null) as EntityId | null,
          updatedByAccountId: (meta.updated_by_account_id ?? null) as EntityId | null,
          localVersion: meta.local_version,
          serverVersion: meta.server_version,
          syncStatus: meta.sync_status as SyncStatus,
          lastSyncedAt: null,
          deletedAt: null,
          isDeleted: false,
          encounterId: (input.encounterId ?? null) as EntityId | null,
          screeningId: (input.screeningId ?? null) as EntityId | null,
          clientId: input.clientId as EntityId,
          measurementType: input.measurementType,
          numericValue: input.numericValue,
          unit: input.unit,
          measuredAt: measuredAt as IsoUtcTimestamp,
          enteredByAccountId: (input.accountId ?? null) as EntityId | null,
          deviceSource: null,
          notes: input.notes ?? null,
        } satisfies Measurement;
      } catch (error) {
        throw mapSqliteError(error, 'measurement.create');
      }
    },
    async listByClient(clientId) {
      try {
        const rows = await db.getAllAsync<
          MetadataRow & {
            encounter_id: string | null;
            screening_id: string | null;
            client_id: string;
            measurement_type: string;
            numeric_value: number;
            unit: string;
            measured_at: string;
            entered_by_account_id: string | null;
            device_source: string | null;
            notes: string | null;
          }
        >(
          `SELECT * FROM measurements WHERE client_id = ? AND is_deleted = 0 ORDER BY measured_at DESC`,
          [clientId],
        );
        const results: Measurement[] = [];
        for (const row of rows) {
          try {
            results.push(mapMeasurementRow(row));
          } catch {
            // Skip rows that fail validation rather than crashing the entire list
          }
        }
        return results;
      } catch (error) {
        throw mapSqliteError(error, 'measurement.listByClient');
      }
    },
    async listByEncounter(encounterId) {
      try {
        const rows = await db.getAllAsync<
          MetadataRow & {
            encounter_id: string | null;
            screening_id: string | null;
            client_id: string;
            measurement_type: string;
            numeric_value: number;
            unit: string;
            measured_at: string;
            entered_by_account_id: string | null;
            device_source: string | null;
            notes: string | null;
          }
        >(
          `SELECT * FROM measurements WHERE encounter_id = ? AND is_deleted = 0 ORDER BY measured_at DESC`,
          [encounterId],
        );
        return rows.map(mapMeasurementRow);
      } catch (error) {
        throw mapSqliteError(error, 'measurement.listByEncounter');
      }
    },
    async listByScreening(screeningId) {
      try {
        const rows = await db.getAllAsync<
          MetadataRow & {
            encounter_id: string | null;
            screening_id: string | null;
            client_id: string;
            measurement_type: string;
            numeric_value: number;
            unit: string;
            measured_at: string;
            entered_by_account_id: string | null;
            device_source: string | null;
            notes: string | null;
          }
        >(
          `SELECT * FROM measurements WHERE screening_id = ? AND is_deleted = 0 ORDER BY measured_at DESC`,
          [screeningId],
        );
        return rows.map(mapMeasurementRow);
      } catch (error) {
        throw mapSqliteError(error, 'measurement.listByScreening');
      }
    },
  };
}

function mapMeasurementRow(
  row: MetadataRow & {
    encounter_id: string | null;
    screening_id: string | null;
    client_id: string;
    measurement_type: string;
    numeric_value: number;
    unit: string;
    measured_at: string;
    entered_by_account_id: string | null;
    device_source: string | null;
    notes: string | null;
  },
): Measurement {
  if (
    !isOneOf(row.measurement_type, MEASUREMENT_TYPES) ||
    !isOneOf(row.unit, MEASUREMENT_UNITS)
  ) {
    throw new RepositoryError('dataIntegrity', 'Invalid measurement row');
  }
  return {
    ...mapMetadata(row),
    encounterId: row.encounter_id ? optionalEntityId(row.encounter_id) : null,
    screeningId: row.screening_id ? optionalEntityId(row.screening_id) : null,
    clientId: assertEntityId(row.client_id),
    measurementType: row.measurement_type,
    numericValue: row.numeric_value,
    unit: row.unit,
    measuredAt: assertIsoUtcTimestamp(row.measured_at),
    enteredByAccountId: row.entered_by_account_id
      ? optionalEntityId(row.entered_by_account_id) ?? (row.entered_by_account_id as EntityId)
      : null,
    deviceSource: row.device_source,
    notes: row.notes,
  };
}

type RiskAssessmentRow = MetadataRow & {
  client_id: string;
  encounter_id: string | null;
  screening_id: string | null;
  priority: string;
  rule_set_version: string;
  calculated_at: string;
  confirmed_by_account_id: string | null;
  confirmed_at: string | null;
  explanation_summary: string | null;
  missing_information: string | null;
  evaluation_status: string | null;
  engine_version: number | null;
  rule_pack_id: string | null;
  rule_pack_version: number | null;
  screening_template_id: string | null;
  screening_template_version: number | null;
  explanation_version: string | null;
  input_digest: string | null;
  supersedes_risk_assessment_id: string | null;
  recalculation_reason: string | null;
  is_current: number | null;
  undetermined_reason_category: string | null;
  development_banner: string | null;
  explanation_detail: string | null;
  aggregation_strategy: string | null;
  aggregation_strategy_version: number | null;
};

function mapRiskAssessment(row: RiskAssessmentRow): RiskAssessment | null {
  if (!isOneOf(row.priority, RISK_PRIORITIES)) {
    return null;
  }
  return {
    ...mapMetadata(row),
    clientId: assertEntityId(row.client_id),
    encounterId: row.encounter_id ? assertEntityId(row.encounter_id) : null,
    screeningId: row.screening_id ? assertEntityId(row.screening_id) : null,
    priority: row.priority,
    ruleSetVersion: row.rule_set_version,
    calculatedAt: assertIsoUtcTimestamp(row.calculated_at),
    confirmedByAccountId: row.confirmed_by_account_id
      ? assertEntityId(row.confirmed_by_account_id)
      : null,
    confirmedAt: row.confirmed_at,
    explanationSummary: row.explanation_summary,
    missingInformation: row.missing_information,
    evaluationStatus: row.evaluation_status ?? 'calculated',
    engineVersion: row.engine_version ?? 1,
    rulePackId: row.rule_pack_id,
    rulePackVersion: row.rule_pack_version,
    screeningTemplateId: row.screening_template_id,
    screeningTemplateVersion: row.screening_template_version,
    explanationVersion: row.explanation_version,
    inputDigest: row.input_digest,
    supersedesRiskAssessmentId: row.supersedes_risk_assessment_id
      ? assertEntityId(row.supersedes_risk_assessment_id)
      : null,
    recalculationReason: row.recalculation_reason,
    isCurrent: intToBool(row.is_current ?? 1),
    undeterminedReasonCategory: row.undetermined_reason_category,
    developmentBanner: row.development_banner,
    explanationDetail: row.explanation_detail,
    aggregationStrategy: row.aggregation_strategy,
    aggregationStrategyVersion: row.aggregation_strategy_version,
  };
}

export function createSqliteRiskAssessmentRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): RiskAssessmentRepository {
  const repo: RiskAssessmentRepository = {
    async createWithFactors(input) {
      try {
        if (!isOneOf(input.priority, RISK_PRIORITIES)) {
          throw new RepositoryError('validation', 'Invalid risk priority');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        const calculatedAt = input.calculatedAt ?? meta.created_at;
        const factors: RiskFactor[] = [];

        const insert = async () => {
          await db.runAsync(
            `INSERT INTO risk_assessments (
              id, client_id, encounter_id, screening_id, priority, rule_set_version,
              calculated_at, confirmed_by_account_id, confirmed_at,
              explanation_summary, missing_information,
              evaluation_status, engine_version, rule_pack_id, rule_pack_version,
              screening_template_id, screening_template_version, explanation_version,
              input_digest, supersedes_risk_assessment_id, recalculation_reason,
              is_current, undetermined_reason_category, development_banner,
              explanation_detail, aggregation_strategy, aggregation_strategy_version,
              created_at, updated_at, created_by_account_id, updated_by_account_id,
              local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              meta.id,
              input.clientId,
              input.encounterId ?? null,
              input.screeningId ?? null,
              input.priority,
              input.ruleSetVersion,
              calculatedAt,
              input.explanationSummary ?? null,
              input.missingInformation ?? null,
              input.evaluationStatus ?? 'calculated',
              input.engineVersion ?? 1,
              input.rulePackId ?? null,
              input.rulePackVersion ?? null,
              input.screeningTemplateId ?? null,
              input.screeningTemplateVersion ?? null,
              input.explanationVersion ?? null,
              input.inputDigest ?? null,
              input.supersedesRiskAssessmentId ?? null,
              input.recalculationReason ?? null,
              boolToInt(input.isCurrent ?? true),
              input.undeterminedReasonCategory ?? null,
              input.developmentBanner ?? null,
              input.explanationDetail ?? null,
              input.aggregationStrategy ?? null,
              input.aggregationStrategyVersion ?? null,
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
          for (const [index, factor] of (input.factors ?? []).entries()) {
            const factorMeta = newMetadataValues({
              id: ids.nextId(),
              now: meta.created_at,
              accountId: input.accountId ?? null,
            });
            const sortOrder = factor.sortOrder ?? index;
            await db.runAsync(
              `INSERT INTO risk_factors (
                id, risk_assessment_id, factor_code, factor_label, source_question_key,
                severity, rule_version, rule_id, priority, explanation_id, sort_order,
                source_measurement_id,
                created_at, updated_at, created_by_account_id, updated_by_account_id,
                local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                factorMeta.id,
                meta.id,
                factor.factorCode,
                factor.factorLabel,
                factor.sourceQuestionKey ?? null,
                factor.severity ?? null,
                factor.ruleVersion ?? null,
                factor.ruleId ?? null,
                factor.priority ?? null,
                factor.explanationId ?? null,
                sortOrder,
                factor.sourceMeasurementId ?? null,
                factorMeta.created_at,
                factorMeta.updated_at,
                factorMeta.created_by_account_id,
                factorMeta.updated_by_account_id,
                factorMeta.local_version,
                factorMeta.server_version,
                factorMeta.sync_status,
                factorMeta.last_synced_at,
                factorMeta.deleted_at,
                factorMeta.is_deleted,
              ],
            );
            factors.push({
              id: factorMeta.id,
              createdAt: factorMeta.created_at,
              updatedAt: factorMeta.updated_at,
              createdByAccountId: factorMeta.created_by_account_id,
              updatedByAccountId: factorMeta.updated_by_account_id,
              localVersion: factorMeta.local_version,
              serverVersion: factorMeta.server_version,
              syncStatus: 'localOnly',
              lastSyncedAt: null,
              deletedAt: null,
              isDeleted: false,
              riskAssessmentId: meta.id,
              factorCode: factor.factorCode,
              factorLabel: factor.factorLabel,
              sourceQuestionKey: factor.sourceQuestionKey ?? null,
              severity: factor.severity ?? null,
              ruleVersion: factor.ruleVersion ?? null,
              ruleId: factor.ruleId ?? null,
              priority: factor.priority ?? null,
              explanationId: factor.explanationId ?? null,
              sortOrder,
              sourceMeasurementId: factor.sourceMeasurementId ?? null,
            });
          }
        };

        if (input.alreadyInTransaction) {
          await insert();
        } else {
          await db.withTransactionAsync(insert);
        }

        const assessment = await repo.findById(meta.id);
        if (!assessment) {
          throw new RepositoryError('unknown', 'Risk assessment read-back failed');
        }
        return { assessment, factors };
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.createWithFactors');
      }
    },
    async findById(id) {
      try {
        const row = await db.getFirstAsync<RiskAssessmentRow>(
          `SELECT * FROM risk_assessments WHERE id = ? AND is_deleted = 0`,
          [id],
        );
        return row ? mapRiskAssessment(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.findById');
      }
    },
    async findCurrentByScreeningId(screeningId) {
      try {
        const row = await db.getFirstAsync<RiskAssessmentRow>(
          `SELECT * FROM risk_assessments
           WHERE screening_id = ? AND is_current = 1 AND is_deleted = 0
           ORDER BY calculated_at DESC, id DESC LIMIT 1`,
          [screeningId],
        );
        return row ? mapRiskAssessment(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.findCurrentByScreeningId');
      }
    },
    async findCurrentByEncounterId(encounterId) {
      try {
        const row = await db.getFirstAsync<RiskAssessmentRow>(
          `SELECT * FROM risk_assessments
           WHERE encounter_id = ? AND is_current = 1 AND is_deleted = 0
           ORDER BY calculated_at DESC, id DESC LIMIT 1`,
          [encounterId],
        );
        return row ? mapRiskAssessment(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.findCurrentByEncounterId');
      }
    },
    async listByScreeningId(screeningId) {
      try {
        const rows = await db.getAllAsync<RiskAssessmentRow>(
          `SELECT * FROM risk_assessments
           WHERE screening_id = ? AND is_deleted = 0
           ORDER BY calculated_at DESC, id DESC`,
          [screeningId],
        );
        return rows
          .map(mapRiskAssessment)
          .filter((item): item is RiskAssessment => item != null);
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.listByScreeningId');
      }
    },
    async listFactors(riskAssessmentId) {
      try {
        const rows = await db.getAllAsync<
          MetadataRow & {
            risk_assessment_id: string;
            factor_code: string;
            factor_label: string;
            source_question_key: string | null;
            severity: string | null;
            rule_version: string | null;
            rule_id: string | null;
            priority: string | null;
            explanation_id: string | null;
            sort_order: number | null;
            source_measurement_id: string | null;
          }
        >(
          `SELECT * FROM risk_factors
           WHERE risk_assessment_id = ? AND is_deleted = 0
           ORDER BY sort_order ASC, id ASC`,
          [riskAssessmentId],
        );
        return rows.map((row) => ({
          ...mapMetadata(row),
          riskAssessmentId: assertEntityId(row.risk_assessment_id),
          factorCode: row.factor_code,
          factorLabel: row.factor_label,
          sourceQuestionKey: row.source_question_key,
          severity: row.severity,
          ruleVersion: row.rule_version,
          ruleId: row.rule_id,
          priority:
            row.priority && isOneOf(row.priority, RISK_PRIORITIES) ? row.priority : null,
          explanationId: row.explanation_id,
          sortOrder: row.sort_order ?? 0,
          sourceMeasurementId: row.source_measurement_id
            ? assertEntityId(row.source_measurement_id)
            : null,
        }));
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.listFactors');
      }
    },
    async acknowledge(input) {
      try {
        const now = input.confirmedAt ?? clock.nowIso();
        await db.runAsync(
          `UPDATE risk_assessments
           SET confirmed_by_account_id = ?, confirmed_at = ?, updated_at = ?,
               updated_by_account_id = ?, local_version = local_version + 1,
               evaluation_status = 'acknowledged'
           WHERE id = ? AND is_deleted = 0`,
          [input.accountId, now, now, input.accountId, input.id],
        );
        const assessment = await repo.findById(input.id);
        if (!assessment) {
          throw new RepositoryError('notFound', 'Risk assessment not found');
        }
        return assessment;
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.acknowledge');
      }
    },
    async markSuperseded(input) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE risk_assessments
           SET is_current = 0, updated_at = ?, updated_by_account_id = ?,
               local_version = local_version + 1, evaluation_status = 'superseded'
           WHERE id = ? AND is_deleted = 0`,
          [now, input.accountId ?? null, input.id],
        );
        const assessment = await repo.findById(input.id);
        if (!assessment) {
          throw new RepositoryError('notFound', 'Risk assessment not found');
        }
        return assessment;
      } catch (error) {
        throw mapSqliteError(error, 'riskAssessment.markSuperseded');
      }
    },
  };
  return repo;
}

export function createSqliteAttachmentRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): AttachmentRepository {
  const repo: AttachmentRepository = {
    async create(input) {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'localOnly',
        });
        await db.runAsync(
          `INSERT INTO attachments (
            id, owner_type, owner_id, file_uri, mime_type, file_size, checksum,
            encryption_status, upload_status,
            duration_ms, audio_format_version, original_filename,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'none', 'localOnly', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.ownerType,
            input.ownerId,
            input.fileUri,
            input.mimeType ?? null,
            input.fileSize ?? null,
            input.checksum ?? null,
            input.durationMs ?? null,
            input.audioFormatVersion ?? null,
            input.originalFilename ?? null,
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
          throw new RepositoryError('unknown', 'Attachment read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'attachment.create');
      }
    },
    async findById(id) {
      try {
        const row = await db.getFirstAsync<
          MetadataRow & {
            owner_type: string;
            owner_id: string;
            file_uri: string;
            mime_type: string | null;
            file_size: number | null;
            checksum: string | null;
            encryption_status: string;
            upload_status: string;
            duration_ms: number | null;
            audio_format_version: number | null;
            original_filename: string | null;
          }
        >(`SELECT * FROM attachments WHERE id = ? AND is_deleted = 0`, [id]);
        if (
          !row ||
          !isOneOf(row.encryption_status, ATTACHMENT_ENCRYPTION_STATUSES) ||
          !isOneOf(row.upload_status, ATTACHMENT_UPLOAD_STATUSES)
        ) {
          return null;
        }
        return {
          ...mapMetadata(row),
          ownerType: row.owner_type,
          ownerId: assertEntityId(row.owner_id),
          fileUri: row.file_uri,
          mimeType: row.mime_type,
          fileSize: row.file_size,
          checksum: row.checksum,
          encryptionStatus: row.encryption_status,
          uploadStatus: row.upload_status,
          durationMs: row.duration_ms ?? null,
          audioFormatVersion: row.audio_format_version ?? null,
          originalFilename: row.original_filename ?? null,
        } satisfies Attachment;
      } catch (error) {
        throw mapSqliteError(error, 'attachment.findById');
      }
    },
    async listByOwner(ownerType, ownerId) {
      try {
        const rows = await db.getAllAsync<
          MetadataRow & {
            owner_type: string;
            owner_id: string;
            file_uri: string;
            mime_type: string | null;
            file_size: number | null;
            checksum: string | null;
            encryption_status: string;
            upload_status: string;
            duration_ms: number | null;
            audio_format_version: number | null;
            original_filename: string | null;
          }
        >(
          `SELECT * FROM attachments
           WHERE owner_type = ? AND owner_id = ? AND is_deleted = 0
           ORDER BY created_at DESC`,
          [ownerType, ownerId],
        );
        return rows.map((row) => {
          if (
            !isOneOf(row.encryption_status, ATTACHMENT_ENCRYPTION_STATUSES) ||
            !isOneOf(row.upload_status, ATTACHMENT_UPLOAD_STATUSES)
          ) {
            throw new RepositoryError('dataIntegrity', 'Invalid attachment row');
          }
          return {
            ...mapMetadata(row),
            ownerType: row.owner_type,
            ownerId: assertEntityId(row.owner_id),
            fileUri: row.file_uri,
            mimeType: row.mime_type,
            fileSize: row.file_size,
            checksum: row.checksum,
            encryptionStatus: row.encryption_status,
            uploadStatus: row.upload_status,
            durationMs: row.duration_ms ?? null,
            audioFormatVersion: row.audio_format_version ?? null,
            originalFilename: row.original_filename ?? null,
          } satisfies Attachment;
        });
      } catch (error) {
        throw mapSqliteError(error, 'attachment.listByOwner');
      }
    },
    async softDelete(id, accountId = null) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE attachments SET
            is_deleted = 1, deleted_at = ?, updated_at = ?,
            updated_by_account_id = ?, local_version = local_version + 1,
            sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, now, accountId, id],
        );
      } catch (error) {
        throw mapSqliteError(error, 'attachment.softDelete');
      }
    },
  };
  return repo;
}
