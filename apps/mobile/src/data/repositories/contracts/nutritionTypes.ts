import type {
  NutritionAssessment,
  NutritionAssessmentAnswer,
  NutritionGuidanceResolution,
  NutritionMeasurementLink,
  NutritionReferenceResult,
} from '../../domain/entities/entities';
import type { AnswerValueType } from '../../domain/enums/domainEnums';
import type { EntityId } from '../../domain/value-objects/EntityId';
import type { DateOnly } from '../../domain/value-objects/dateOnly';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';

export type CreateNutritionAssessmentInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly encounterId?: EntityId | null;
  readonly assessmentDate: DateOnly;
  readonly assessmentType?: string | null;
  readonly templateId?: string | null;
  readonly templateVersion?: number | null;
  readonly facilityId?: EntityId | null;
  readonly startedAt?: IsoUtcTimestamp | null;
  readonly status?: NutritionAssessment['status'];
  readonly engineVersion?: number | null;
  readonly accountId?: EntityId | null;
};

export type UpdateNutritionAssessmentInput = {
  readonly id: EntityId;
  readonly accountId?: EntityId | null;
  readonly status?: NutritionAssessment['status'];
  readonly progressSectionId?: string | null;
  readonly followUpDate?: DateOnly | null;
  readonly followUpSource?: string | null;
  readonly guidanceContentVersion?: string | null;
  readonly completedAt?: IsoUtcTimestamp | null;
  readonly confirmedByAccountId?: EntityId | null;
  readonly confirmedAt?: IsoUtcTimestamp | null;
  readonly discardReason?: string | null;
  readonly supersededById?: EntityId | null;
  readonly supersedesId?: EntityId | null;
  readonly syncStatus?: NutritionAssessment['syncStatus'];
};

export type SaveNutritionAnswerInput = {
  readonly id?: EntityId;
  readonly nutritionAssessmentId: EntityId;
  readonly questionKey: string;
  readonly valueType: AnswerValueType;
  readonly booleanValue?: boolean | null;
  readonly numberValue?: number | null;
  readonly textValue?: string | null;
  readonly dateValue?: DateOnly | null;
  readonly optionValue?: string | null;
  readonly multipleOptionsJson?: string | null;
  readonly accountId?: EntityId | null;
};

export type NutritionAssessmentRepository = {
  create(input: CreateNutritionAssessmentInput): Promise<NutritionAssessment>;
  findById(id: EntityId): Promise<NutritionAssessment | null>;
  listByClient(clientId: EntityId): Promise<NutritionAssessment[]>;
  listRecent(limit?: number): Promise<NutritionAssessment[]>;
  findDraftByClient(clientId: EntityId): Promise<NutritionAssessment | null>;
  update(input: UpdateNutritionAssessmentInput): Promise<NutritionAssessment>;
  saveAnswer(input: SaveNutritionAnswerInput): Promise<NutritionAssessmentAnswer>;
  listAnswers(nutritionAssessmentId: EntityId): Promise<NutritionAssessmentAnswer[]>;
  linkMeasurement(input: {
    readonly id?: EntityId;
    readonly nutritionAssessmentId: EntityId;
    readonly measurementId: EntityId;
    readonly questionKey?: string | null;
    readonly linkRole?: string;
    readonly accountId?: EntityId | null;
  }): Promise<NutritionMeasurementLink>;
  listMeasurementLinks(
    nutritionAssessmentId: EntityId,
  ): Promise<NutritionMeasurementLink[]>;
  createReferenceResult(input: {
    readonly id?: EntityId;
    readonly nutritionAssessmentId: EntityId;
    readonly referencePackId: string;
    readonly referencePackVersion: number;
    readonly engineVersion: number;
    readonly resultStatus: string;
    readonly interpretationCode?: string | null;
    readonly derivedValue?: number | null;
    readonly derivedUnit?: string | null;
    readonly missingInformationJson?: string | null;
    readonly inputMeasurementIdsJson?: string | null;
    readonly explanationId?: string | null;
    readonly growthIndicatorsJson?: string | null;
    readonly calculatedAt: IsoUtcTimestamp;
    readonly supersedesResultId?: EntityId | null;
    readonly isDevelopment?: boolean;
    readonly accountId?: EntityId | null;
  }): Promise<NutritionReferenceResult>;
  listReferenceResults(
    nutritionAssessmentId: EntityId,
  ): Promise<NutritionReferenceResult[]>;
  createGuidanceResolution(input: {
    readonly id?: EntityId;
    readonly nutritionAssessmentId: EntityId;
    readonly guidancePackId?: string | null;
    readonly guidancePackVersion?: number | null;
    readonly resolutionStatus: string;
    readonly guidanceIdsJson?: string | null;
    readonly resolvedAt: IsoUtcTimestamp;
    readonly supersedesResolutionId?: EntityId | null;
    readonly isDevelopment?: boolean;
    readonly accountId?: EntityId | null;
  }): Promise<NutritionGuidanceResolution>;
  acknowledgeGuidance(input: {
    readonly id: EntityId;
    readonly accountId: EntityId;
    readonly acknowledgedAt: IsoUtcTimestamp;
  }): Promise<NutritionGuidanceResolution>;
  listGuidanceResolutions(
    nutritionAssessmentId: EntityId,
  ): Promise<NutritionGuidanceResolution[]>;
  softDelete(input: {
    readonly id: EntityId;
    readonly accountId?: EntityId | null;
    readonly discardReason?: string | null;
  }): Promise<void>;
};
