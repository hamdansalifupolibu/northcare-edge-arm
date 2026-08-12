import type {
  NutritionAssessment,
  NutritionAssessmentAnswer,
  NutritionGuidanceResolution,
  NutritionMeasurementLink,
  NutritionReferenceResult,
} from '../../domain/entities/entities';
import {
  ANSWER_VALUE_TYPES,
  isOneOf,
  NUTRITION_STATUSES,
} from '../../domain/enums/domainEnums';
import type { Clock } from '../../domain/value-objects/clock';
import type { DateOnly } from '../../domain/value-objects/dateOnly';
import { assertDateOnly } from '../../domain/value-objects/dateOnly';
import type { EntityId } from '../../domain/value-objects/EntityId';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { SyncStatus } from '../../domain/enums/syncStatus';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  CreateNutritionAssessmentInput,
  NutritionAssessmentRepository,
  SaveNutritionAnswerInput,
  UpdateNutritionAssessmentInput,
} from '../contracts/nutritionTypes';
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

type NutritionAssessmentRow = MetadataRow & {
  client_id: string;
  encounter_id: string | null;
  assessment_date: string;
  assessment_type: string | null;
  template_id: string | null;
  template_version: number | null;
  facility_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  confirmed_by_account_id: string | null;
  confirmed_at: string | null;
  follow_up_source: string | null;
  progress_section_id: string | null;
  superseded_by_id: string | null;
  supersedes_id: string | null;
  engine_version: number | null;
  discard_reason: string | null;
  breastfeeding_status: string | null;
  complementary_feeding_status: string | null;
  meals_per_day: number | null;
  food_diversity_score: number | null;
  guidance_content_version: string | null;
  follow_up_date: string | null;
  status: string;
};

type NutritionAnswerRow = MetadataRow & {
  nutrition_assessment_id: string;
  question_key: string;
  value_type: string;
  boolean_value: number | null;
  number_value: number | null;
  text_value: string | null;
  date_value: string | null;
  option_value: string | null;
  multiple_options_json: string | null;
};

type MeasurementLinkRow = MetadataRow & {
  nutrition_assessment_id: string;
  measurement_id: string;
  question_key: string | null;
  link_role: string;
};

type ReferenceResultRow = MetadataRow & {
  nutrition_assessment_id: string;
  reference_pack_id: string;
  reference_pack_version: number;
  engine_version: number;
  result_status: string;
  interpretation_code: string | null;
  derived_value: number | null;
  derived_unit: string | null;
  missing_information_json: string | null;
  input_measurement_ids_json: string | null;
  explanation_id: string | null;
  growth_indicators_json: string | null;
  calculated_at: string;
  supersedes_result_id: string | null;
  is_development: number;
};

type GuidanceResolutionRow = MetadataRow & {
  nutrition_assessment_id: string;
  guidance_pack_id: string | null;
  guidance_pack_version: number | null;
  resolution_status: string;
  guidance_ids_json: string | null;
  resolved_at: string;
  acknowledged_by_account_id: string | null;
  acknowledged_at: string | null;
  supersedes_resolution_id: string | null;
  is_development: number;
};

function mapNutritionAssessment(row: NutritionAssessmentRow): NutritionAssessment | null {
  if (!isOneOf(row.status, NUTRITION_STATUSES)) {
    return null;
  }
  try {
    return {
      ...mapMetadata(row),
      clientId: assertEntityId(row.client_id),
      encounterId: row.encounter_id ? optionalEntityId(row.encounter_id) : null,
      assessmentDate: assertDateOnly(row.assessment_date),
      assessmentType: row.assessment_type,
      templateId: row.template_id,
      templateVersion: row.template_version,
      facilityId: row.facility_id ? optionalEntityId(row.facility_id) ?? (row.facility_id as EntityId) : null,
      startedAt: row.started_at ? assertIsoUtcTimestamp(row.started_at) : null,
      completedAt: row.completed_at ? assertIsoUtcTimestamp(row.completed_at) : null,
      confirmedByAccountId: row.confirmed_by_account_id
        ? optionalEntityId(row.confirmed_by_account_id) ?? (row.confirmed_by_account_id as EntityId)
        : null,
      confirmedAt: row.confirmed_at ? assertIsoUtcTimestamp(row.confirmed_at) : null,
      followUpSource: row.follow_up_source,
      progressSectionId: row.progress_section_id,
      supersededById: row.superseded_by_id ? optionalEntityId(row.superseded_by_id) : null,
      supersedesId: row.supersedes_id ? optionalEntityId(row.supersedes_id) : null,
      engineVersion: row.engine_version,
      discardReason: row.discard_reason,
      breastfeedingStatus: row.breastfeeding_status,
      complementaryFeedingStatus: row.complementary_feeding_status,
      mealsPerDay: row.meals_per_day,
      foodDiversityScore: row.food_diversity_score,
      guidanceContentVersion: row.guidance_content_version,
      followUpDate: row.follow_up_date ? assertDateOnly(row.follow_up_date) : null,
      status: row.status,
    };
  } catch (err) {
    console.error('[Nutrition] mapNutritionAssessment failed:', err);
    return null;
  }
}

function mapNutritionAnswer(row: NutritionAnswerRow): NutritionAssessmentAnswer {
  if (!isOneOf(row.value_type, ANSWER_VALUE_TYPES)) {
    throw new RepositoryError('dataIntegrity', 'Invalid nutrition answer value type');
  }
  return {
    ...mapMetadata(row),
    nutritionAssessmentId: assertEntityId(row.nutrition_assessment_id),
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

function mapMeasurementLink(row: MeasurementLinkRow): NutritionMeasurementLink {
  return {
    ...mapMetadata(row),
    nutritionAssessmentId: assertEntityId(row.nutrition_assessment_id),
    measurementId: assertEntityId(row.measurement_id),
    questionKey: row.question_key,
    linkRole: row.link_role,
  };
}

function mapReferenceResult(row: ReferenceResultRow): NutritionReferenceResult {
  return {
    ...mapMetadata(row),
    nutritionAssessmentId: assertEntityId(row.nutrition_assessment_id),
    referencePackId: row.reference_pack_id,
    referencePackVersion: row.reference_pack_version,
    engineVersion: row.engine_version,
    resultStatus: row.result_status,
    interpretationCode: row.interpretation_code,
    derivedValue: row.derived_value,
    derivedUnit: row.derived_unit,
    missingInformationJson: row.missing_information_json,
    inputMeasurementIdsJson: row.input_measurement_ids_json,
    explanationId: row.explanation_id,
    growthIndicatorsJson: row.growth_indicators_json,
    calculatedAt: assertIsoUtcTimestamp(row.calculated_at),
    supersedesResultId: row.supersedes_result_id
      ? assertEntityId(row.supersedes_result_id)
      : null,
    isDevelopment: intToBool(row.is_development),
  };
}

function mapGuidanceResolution(row: GuidanceResolutionRow): NutritionGuidanceResolution {
  return {
    ...mapMetadata(row),
    nutritionAssessmentId: assertEntityId(row.nutrition_assessment_id),
    guidancePackId: row.guidance_pack_id,
    guidancePackVersion: row.guidance_pack_version,
    resolutionStatus: row.resolution_status,
    guidanceIdsJson: row.guidance_ids_json,
    resolvedAt: assertIsoUtcTimestamp(row.resolved_at),
    acknowledgedByAccountId: row.acknowledged_by_account_id
      ? optionalEntityId(row.acknowledged_by_account_id) ?? (row.acknowledged_by_account_id as EntityId)
      : null,
    acknowledgedAt: row.acknowledged_at
      ? assertIsoUtcTimestamp(row.acknowledged_at)
      : null,
    supersedesResolutionId: row.supersedes_resolution_id
      ? optionalEntityId(row.supersedes_resolution_id)
      : null,
    isDevelopment: intToBool(row.is_development),
  };
}

function validateNutritionAnswerInput(input: SaveNutritionAnswerInput): void {
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

export function createSqliteNutritionAssessmentRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): NutritionAssessmentRepository {
  const repo: NutritionAssessmentRepository = {
    async create(input: CreateNutritionAssessmentInput): Promise<NutritionAssessment> {
      try {
        assertDateOnly(input.assessmentDate);
        const status = input.status ?? 'draft';
        if (!isOneOf(status, NUTRITION_STATUSES)) {
          throw new RepositoryError('validation', 'Invalid nutrition status');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO nutrition_assessments (
            id, client_id, encounter_id, assessment_date,
            assessment_type, template_id, template_version, facility_id,
            started_at, completed_at, confirmed_by_account_id, confirmed_at,
            follow_up_source, progress_section_id, superseded_by_id, supersedes_id,
            engine_version, discard_reason,
            breastfeeding_status, complementary_feeding_status, meals_per_day,
            food_diversity_score, guidance_content_version, follow_up_date, status,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL,
            NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.clientId,
            input.encounterId ?? null,
            input.assessmentDate,
            input.assessmentType ?? null,
            input.templateId ?? null,
            input.templateVersion ?? null,
            input.facilityId ?? null,
            input.startedAt ?? null,
            input.engineVersion ?? null,
            status,
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
          clientId: input.clientId as EntityId,
          encounterId: (input.encounterId ?? null) as EntityId | null,
          assessmentDate: input.assessmentDate as DateOnly,
          assessmentType: input.assessmentType ?? null,
          templateId: input.templateId ?? null,
          templateVersion: input.templateVersion ?? null,
          facilityId: (input.facilityId ?? null) as EntityId | null,
          startedAt: (input.startedAt ?? null) as IsoUtcTimestamp | null,
          completedAt: null,
          confirmedByAccountId: null,
          confirmedAt: null,
          followUpSource: null,
          progressSectionId: null,
          supersededById: null,
          supersedesId: null,
          engineVersion: input.engineVersion ?? null,
          discardReason: null,
          breastfeedingStatus: null,
          complementaryFeedingStatus: null,
          mealsPerDay: null,
          foodDiversityScore: null,
          guidanceContentVersion: null,
          followUpDate: null,
          status,
        };
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.create');
      }
    },

    async findById(id) {
      try {
        const row = await db.getFirstAsync<NutritionAssessmentRow>(
          `SELECT * FROM nutrition_assessments WHERE id = ? AND is_deleted = 0`,
          [id],
        );
        return row ? mapNutritionAssessment(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.findById');
      }
    },

    async listByClient(clientId) {
      try {
        const rows = await db.getAllAsync<NutritionAssessmentRow>(
          `SELECT * FROM nutrition_assessments
           WHERE client_id = ? AND is_deleted = 0
           ORDER BY updated_at DESC`,
          [clientId],
        );
        return rows
          .map(mapNutritionAssessment)
          .filter((item): item is NutritionAssessment => item != null);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.listByClient');
      }
    },

    async listRecent(limit = 20) {
      try {
        const rows = await db.getAllAsync<NutritionAssessmentRow>(
          `SELECT * FROM nutrition_assessments
           WHERE is_deleted = 0
           ORDER BY updated_at DESC
           LIMIT ?`,
          [limit],
        );
        return rows
          .map(mapNutritionAssessment)
          .filter((item): item is NutritionAssessment => item != null);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.listRecent');
      }
    },

    async findDraftByClient(clientId) {
      try {
        const row = await db.getFirstAsync<NutritionAssessmentRow>(
          `SELECT * FROM nutrition_assessments
           WHERE client_id = ? AND status = 'draft' AND is_deleted = 0
           ORDER BY updated_at DESC
           LIMIT 1`,
          [clientId],
        );
        return row ? mapNutritionAssessment(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.findDraftByClient');
      }
    },

    async update(input: UpdateNutritionAssessmentInput): Promise<NutritionAssessment> {
      try {
        const row = await db.getFirstAsync<NutritionAssessmentRow>(
          `SELECT * FROM nutrition_assessments WHERE id = ? AND is_deleted = 0`,
          [input.id],
        );
        if (!row) {
          throw new RepositoryError('notFound', 'Nutrition assessment not found');
        }
        const status = input.status ?? row.status;
        if (!isOneOf(status, NUTRITION_STATUSES)) {
          throw new RepositoryError('validation', 'Invalid nutrition status');
        }
        const now = clock.nowIso();
        const syncStatus = input.syncStatus ?? 'pendingUpdate';
        const resolvedProgressSectionId = input.progressSectionId !== undefined
          ? input.progressSectionId
          : row.progress_section_id;
        const resolvedFollowUpDate = input.followUpDate !== undefined ? input.followUpDate : row.follow_up_date;
        const resolvedFollowUpSource = input.followUpSource !== undefined
          ? input.followUpSource
          : row.follow_up_source;
        const resolvedGuidanceContentVersion = input.guidanceContentVersion !== undefined
          ? input.guidanceContentVersion
          : row.guidance_content_version;
        const resolvedCompletedAt = input.completedAt !== undefined ? input.completedAt : row.completed_at;
        const resolvedConfirmedByAccountId = input.confirmedByAccountId !== undefined
          ? input.confirmedByAccountId
          : row.confirmed_by_account_id;
        const resolvedConfirmedAt = input.confirmedAt !== undefined ? input.confirmedAt : row.confirmed_at;
        const resolvedDiscardReason = input.discardReason !== undefined
          ? input.discardReason
          : row.discard_reason;
        const resolvedSupersededById = input.supersededById !== undefined
          ? input.supersededById
          : row.superseded_by_id;
        const resolvedSupersedesId = input.supersedesId !== undefined
          ? input.supersedesId
          : row.supersedes_id;

        await db.runAsync(
          `UPDATE nutrition_assessments SET
            status = ?,
            progress_section_id = ?,
            follow_up_date = ?,
            follow_up_source = ?,
            guidance_content_version = ?,
            completed_at = ?,
            confirmed_by_account_id = ?,
            confirmed_at = ?,
            discard_reason = ?,
            superseded_by_id = ?,
            supersedes_id = ?,
            updated_at = ?,
            updated_by_account_id = ?,
            local_version = local_version + 1,
            sync_status = ?
           WHERE id = ? AND is_deleted = 0`,
          [
            status,
            resolvedProgressSectionId,
            resolvedFollowUpDate,
            resolvedFollowUpSource,
            resolvedGuidanceContentVersion,
            resolvedCompletedAt,
            resolvedConfirmedByAccountId,
            resolvedConfirmedAt,
            resolvedDiscardReason,
            resolvedSupersededById,
            resolvedSupersedesId,
            now,
            input.accountId ?? null,
            syncStatus,
            input.id,
          ],
        );
        return {
          id: row.id as EntityId,
          createdAt: row.created_at as IsoUtcTimestamp,
          updatedAt: now as IsoUtcTimestamp,
          createdByAccountId: (row.created_by_account_id ?? null) as EntityId | null,
          updatedByAccountId: (input.accountId ?? null) as EntityId | null,
          localVersion: row.local_version + 1,
          serverVersion: row.server_version,
          syncStatus: syncStatus as SyncStatus,
          lastSyncedAt: null,
          deletedAt: null,
          isDeleted: false,
          clientId: row.client_id as EntityId,
          encounterId: (row.encounter_id ?? null) as EntityId | null,
          assessmentDate: row.assessment_date as DateOnly,
          assessmentType: row.assessment_type,
          templateId: row.template_id,
          templateVersion: row.template_version,
          facilityId: (row.facility_id ?? null) as EntityId | null,
          startedAt: (row.started_at ?? null) as IsoUtcTimestamp | null,
          completedAt: (resolvedCompletedAt ?? null) as IsoUtcTimestamp | null,
          confirmedByAccountId: (resolvedConfirmedByAccountId ?? null) as EntityId | null,
          confirmedAt: (resolvedConfirmedAt ?? null) as IsoUtcTimestamp | null,
          followUpSource: resolvedFollowUpSource ?? null,
          progressSectionId: resolvedProgressSectionId ?? null,
          supersededById: (resolvedSupersededById ?? null) as EntityId | null,
          supersedesId: (resolvedSupersedesId ?? null) as EntityId | null,
          engineVersion: row.engine_version,
          discardReason: resolvedDiscardReason ?? null,
          breastfeedingStatus: row.breastfeeding_status,
          complementaryFeedingStatus: row.complementary_feeding_status,
          mealsPerDay: row.meals_per_day,
          foodDiversityScore: row.food_diversity_score,
          guidanceContentVersion: resolvedGuidanceContentVersion ?? null,
          followUpDate: (resolvedFollowUpDate ?? null) as DateOnly | null,
          status,
        };
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.update');
      }
    },

    async saveAnswer(input: SaveNutritionAnswerInput): Promise<NutritionAssessmentAnswer> {
      try {
        validateNutritionAnswerInput(input);
        const assessment = await repo.findById(input.nutritionAssessmentId);
        if (!assessment) {
          throw new RepositoryError('notFound', 'Nutrition assessment not found');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO nutrition_assessment_answers (
            id, nutrition_assessment_id, question_key, value_type, boolean_value, number_value,
            text_value, date_value, option_value, multiple_options_json,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(nutrition_assessment_id, question_key) DO UPDATE SET
            value_type = excluded.value_type,
            boolean_value = excluded.boolean_value,
            number_value = excluded.number_value,
            text_value = excluded.text_value,
            date_value = excluded.date_value,
            option_value = excluded.option_value,
            multiple_options_json = excluded.multiple_options_json,
            updated_at = excluded.updated_at,
            updated_by_account_id = excluded.updated_by_account_id,
            local_version = nutrition_assessment_answers.local_version + 1,
            sync_status = 'pendingUpdate',
            is_deleted = 0,
            deleted_at = NULL`,
          [
            meta.id,
            input.nutritionAssessmentId,
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
        const row = await db.getFirstAsync<NutritionAnswerRow>(
          `SELECT * FROM nutrition_assessment_answers
           WHERE nutrition_assessment_id = ? AND question_key = ? AND is_deleted = 0`,
          [input.nutritionAssessmentId, input.questionKey],
        );
        if (!row) {
          throw new RepositoryError('unknown', 'Nutrition answer read-back failed');
        }
        return mapNutritionAnswer(row);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.saveAnswer');
      }
    },

    async listAnswers(nutritionAssessmentId) {
      try {
        const rows = await db.getAllAsync<NutritionAnswerRow>(
          `SELECT * FROM nutrition_assessment_answers
           WHERE nutrition_assessment_id = ? AND is_deleted = 0
           ORDER BY question_key ASC`,
          [nutritionAssessmentId],
        );
        return rows.map(mapNutritionAnswer);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.listAnswers');
      }
    },

    async linkMeasurement(input) {
      try {
        const assessment = await repo.findById(input.nutritionAssessmentId);
        if (!assessment) {
          throw new RepositoryError('notFound', 'Nutrition assessment not found');
        }
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        const linkRole = input.linkRole ?? 'associated';
        try {
          await db.runAsync(
            `INSERT INTO nutrition_measurement_links (
              id, nutrition_assessment_id, measurement_id, question_key, link_role,
              created_at, updated_at, created_by_account_id, updated_by_account_id,
              local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              meta.id,
              input.nutritionAssessmentId,
              input.measurementId,
              input.questionKey ?? null,
              linkRole,
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
          const created = await db.getFirstAsync<MeasurementLinkRow>(
            `SELECT * FROM nutrition_measurement_links WHERE id = ? AND is_deleted = 0`,
            [meta.id],
          );
          if (!created) {
            throw new RepositoryError('unknown', 'Nutrition measurement link read-back failed');
          }
          return mapMeasurementLink(created);
        } catch (error) {
          const mapped = mapSqliteError(error, 'nutritionAssessment.linkMeasurement');
          if (mapped.category === 'duplicate') {
            const existing = await db.getFirstAsync<MeasurementLinkRow>(
              `SELECT * FROM nutrition_measurement_links
               WHERE nutrition_assessment_id = ? AND measurement_id = ? AND is_deleted = 0`,
              [input.nutritionAssessmentId, input.measurementId],
            );
            if (existing) {
              return mapMeasurementLink(existing);
            }
            throw new RepositoryError(
              'conflict',
              'Nutrition measurement link duplicate without existing row',
            );
          }
          throw mapped;
        }
      } catch (error) {
        if (error instanceof RepositoryError) {
          throw error;
        }
        throw mapSqliteError(error, 'nutritionAssessment.linkMeasurement');
      }
    },

    async listMeasurementLinks(nutritionAssessmentId) {
      try {
        const rows = await db.getAllAsync<MeasurementLinkRow>(
          `SELECT * FROM nutrition_measurement_links
           WHERE nutrition_assessment_id = ? AND is_deleted = 0
           ORDER BY created_at ASC`,
          [nutritionAssessmentId],
        );
        return rows.map(mapMeasurementLink);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.listMeasurementLinks');
      }
    },

    async createReferenceResult(input) {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO nutrition_reference_results (
            id, nutrition_assessment_id, reference_pack_id, reference_pack_version,
            engine_version, result_status, interpretation_code, derived_value, derived_unit,
            missing_information_json, input_measurement_ids_json, explanation_id,
            growth_indicators_json, calculated_at, supersedes_result_id, is_development,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.nutritionAssessmentId,
            input.referencePackId,
            input.referencePackVersion,
            input.engineVersion,
            input.resultStatus,
            input.interpretationCode ?? null,
            input.derivedValue ?? null,
            input.derivedUnit ?? null,
            input.missingInformationJson ?? null,
            input.inputMeasurementIdsJson ?? null,
            input.explanationId ?? null,
            input.growthIndicatorsJson ?? null,
            input.calculatedAt,
            input.supersedesResultId ?? null,
            boolToInt(input.isDevelopment ?? false),
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
        const row = await db.getFirstAsync<ReferenceResultRow>(
          `SELECT * FROM nutrition_reference_results WHERE id = ? AND is_deleted = 0`,
          [meta.id],
        );
        if (!row) {
          throw new RepositoryError('unknown', 'Nutrition reference result read-back failed');
        }
        return mapReferenceResult(row);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.createReferenceResult');
      }
    },

    async listReferenceResults(nutritionAssessmentId) {
      try {
        const rows = await db.getAllAsync<ReferenceResultRow>(
          `SELECT * FROM nutrition_reference_results
           WHERE nutrition_assessment_id = ? AND is_deleted = 0
           ORDER BY calculated_at DESC, id DESC`,
          [nutritionAssessmentId],
        );
        return rows.map(mapReferenceResult);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.listReferenceResults');
      }
    },

    async createGuidanceResolution(input) {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'pendingCreate',
        });
        await db.runAsync(
          `INSERT INTO nutrition_guidance_resolutions (
            id, nutrition_assessment_id, guidance_pack_id, guidance_pack_version,
            resolution_status, guidance_ids_json, resolved_at,
            acknowledged_by_account_id, acknowledged_at, supersedes_resolution_id, is_development,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meta.id,
            input.nutritionAssessmentId,
            input.guidancePackId ?? null,
            input.guidancePackVersion ?? null,
            input.resolutionStatus,
            input.guidanceIdsJson ?? null,
            input.resolvedAt,
            input.supersedesResolutionId ?? null,
            boolToInt(input.isDevelopment ?? false),
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
        const row = await db.getFirstAsync<GuidanceResolutionRow>(
          `SELECT * FROM nutrition_guidance_resolutions WHERE id = ? AND is_deleted = 0`,
          [meta.id],
        );
        if (!row) {
          throw new RepositoryError('unknown', 'Nutrition guidance resolution read-back failed');
        }
        return mapGuidanceResolution(row);
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.createGuidanceResolution');
      }
    },

    async acknowledgeGuidance(input) {
      try {
        const row = await db.getFirstAsync<GuidanceResolutionRow>(
          `SELECT * FROM nutrition_guidance_resolutions WHERE id = ? AND is_deleted = 0`,
          [input.id],
        );
        if (!row) {
          throw new RepositoryError('notFound', 'Nutrition guidance resolution not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE nutrition_guidance_resolutions SET
            acknowledged_by_account_id = ?,
            acknowledged_at = ?,
            updated_at = ?,
            updated_by_account_id = ?,
            local_version = local_version + 1,
            sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [input.accountId, input.acknowledgedAt, now, input.accountId, input.id],
        );
        return {
          ...mapMetadata(row),
          nutritionAssessmentId: assertEntityId(row.nutrition_assessment_id),
          guidancePackId: row.guidance_pack_id,
          guidancePackVersion: row.guidance_pack_version,
          resolutionStatus: row.resolution_status,
          guidanceIdsJson: row.guidance_ids_json,
          resolvedAt: row.resolved_at as IsoUtcTimestamp,
          acknowledgedByAccountId: (input.accountId ?? null) as EntityId | null,
          acknowledgedAt: (input.acknowledgedAt ?? null) as IsoUtcTimestamp | null,
          supersedesResolutionId: row.supersedes_resolution_id
            ? optionalEntityId(row.supersedes_resolution_id)
            : null,
          isDevelopment: intToBool(row.is_development),
        } as NutritionGuidanceResolution;
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.acknowledgeGuidance');
      }
    },

    async listGuidanceResolutions(nutritionAssessmentId) {
      try {
        const rows = await db.getAllAsync<GuidanceResolutionRow>(
          `SELECT * FROM nutrition_guidance_resolutions
           WHERE nutrition_assessment_id = ? AND is_deleted = 0
           ORDER BY resolved_at DESC, id DESC`,
          [nutritionAssessmentId],
        );
        const results: NutritionGuidanceResolution[] = [];
        for (const row of rows) {
          try {
            results.push(mapGuidanceResolution(row));
          } catch {
            // Skip rows that fail assertion
          }
        }
        return results;
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.listGuidanceResolutions');
      }
    },

    async softDelete(input) {
      try {
        const row = await db.getFirstAsync<NutritionAssessmentRow>(
          `SELECT * FROM nutrition_assessments WHERE id = ? AND is_deleted = 0`,
          [input.id],
        );
        if (!row) {
          throw new RepositoryError('notFound', 'Nutrition assessment not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE nutrition_assessments SET
            is_deleted = 1,
            deleted_at = ?,
            discard_reason = ?,
            updated_at = ?,
            updated_by_account_id = ?,
            local_version = local_version + 1,
            sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [now, input.discardReason ?? 'workerDeleted', now, input.accountId ?? null, input.id],
        );
      } catch (error) {
        throw mapSqliteError(error, 'nutritionAssessment.softDelete');
      }
    },
  };
  return repo;
}
