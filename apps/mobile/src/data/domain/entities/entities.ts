import type { AgeUnit } from '../enums/ageUnit';
import type { ClientCategory } from '../enums/clientCategory';
import type {
  AnswerValueType,
  AttachmentEncryptionStatus,
  AttachmentUploadStatus,
  ConsentStatus,
  EncounterStatus,
  EncounterType,
  LocalAccountRole,
  MeasurementType,
  MeasurementUnit,
  NutritionStatus,
  ReferralOrigin,
  ReferralPassportStatus,
  ReferralPrioritySource,
  ReferralStatus,
  RelationshipType,
  RiskPriority,
  ScreeningStatus,
  ScreeningType,
  SyncQueueOperation,
  SyncQueueState,
  TransportStatus,
} from '../enums/domainEnums';
import type { EntityId } from '../value-objects/EntityId';
import type { DateOnly } from '../value-objects/dateOnly';
import type { RecordMetadata } from '../value-objects/RecordMetadata';
import type { IsoUtcTimestamp } from '../value-objects/timestamps';

export type Facility = RecordMetadata & {
  readonly externalCode: string | null;
  readonly name: string;
  readonly facilityType: string | null;
  readonly district: string | null;
  readonly region: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly isActive: boolean;
};

/** Local DB reference only — never stores PIN/password/token. */
export type LocalAccountReference = {
  readonly accountId: EntityId;
  readonly role: LocalAccountRole;
  readonly facilityId: EntityId | null;
  readonly displayName: string;
  readonly lastSeenAt: IsoUtcTimestamp | null;
  readonly createdAt: IsoUtcTimestamp;
  readonly updatedAt: IsoUtcTimestamp;
};

export type Client = RecordMetadata & {
  readonly clientCode: string;
  readonly category: ClientCategory;
  readonly givenName: string;
  readonly familyName: string;
  readonly preferredName: string | null;
  readonly sex: string | null;
  readonly dateOfBirth: DateOnly | null;
  readonly approximateAge: number | null;
  readonly approximateAgeUnit: AgeUnit | null;
  readonly pregnancyStatus: string | null;
  readonly estimatedDeliveryDate: DateOnly | null;
  readonly phoneNumber: string | null;
  readonly community: string | null;
  readonly district: string | null;
  readonly region: string | null;
  readonly primaryFacilityId: EntityId | null;
  readonly consentStatus: ConsentStatus;
  readonly consentRecordedAt: IsoUtcTimestamp | null;
  readonly notes: string | null;
  readonly searchNormalized: string;
};

export type Caregiver = RecordMetadata & {
  readonly givenName: string;
  readonly familyName: string;
  readonly phoneNumber: string | null;
  readonly community: string | null;
  readonly notes: string | null;
};

export type ClientRelationship = RecordMetadata & {
  readonly clientId: EntityId;
  readonly caregiverId: EntityId;
  readonly relationshipType: RelationshipType;
  readonly isPrimary: boolean;
  readonly validFrom: DateOnly | null;
  readonly validTo: DateOnly | null;
};

export type Encounter = RecordMetadata & {
  readonly clientId: EntityId;
  readonly encounterType: EncounterType;
  readonly occurredAt: IsoUtcTimestamp | null;
  readonly facilityId: EntityId | null;
  readonly workerAccountId: EntityId | null;
  readonly status: EncounterStatus;
  readonly startedAt: IsoUtcTimestamp | null;
  readonly completedAt: IsoUtcTimestamp | null;
  readonly draftSavedAt: IsoUtcTimestamp | null;
  readonly source: string | null;
  readonly notes: string | null;
};

export type Screening = RecordMetadata & {
  readonly encounterId: EntityId;
  readonly clientId: EntityId;
  readonly screeningType: ScreeningType;
  readonly schemaVersion: number;
  readonly status: ScreeningStatus;
  readonly startedAt: IsoUtcTimestamp | null;
  readonly completedAt: IsoUtcTimestamp | null;
  readonly reviewedByAccountId: EntityId | null;
};

export type ScreeningAnswer = RecordMetadata & {
  readonly screeningId: EntityId;
  readonly questionKey: string;
  readonly valueType: AnswerValueType;
  readonly booleanValue: boolean | null;
  readonly numberValue: number | null;
  readonly textValue: string | null;
  readonly dateValue: DateOnly | null;
  readonly optionValue: string | null;
  readonly multipleOptionsJson: string | null;
};

export type Measurement = RecordMetadata & {
  readonly encounterId: EntityId | null;
  readonly screeningId: EntityId | null;
  readonly clientId: EntityId;
  readonly measurementType: MeasurementType;
  readonly numericValue: number;
  readonly unit: MeasurementUnit;
  readonly measuredAt: IsoUtcTimestamp;
  readonly enteredByAccountId: EntityId | null;
  readonly deviceSource: string | null;
  readonly notes: string | null;
};

export type RiskAssessment = RecordMetadata & {
  readonly clientId: EntityId;
  readonly encounterId: EntityId | null;
  readonly screeningId: EntityId | null;
  readonly priority: RiskPriority;
  readonly ruleSetVersion: string;
  readonly calculatedAt: IsoUtcTimestamp;
  readonly confirmedByAccountId: EntityId | null;
  readonly confirmedAt: IsoUtcTimestamp | null;
  readonly explanationSummary: string | null;
  readonly missingInformation: string | null;
  readonly evaluationStatus: string;
  readonly engineVersion: number;
  readonly rulePackId: string | null;
  readonly rulePackVersion: number | null;
  readonly screeningTemplateId: string | null;
  readonly screeningTemplateVersion: number | null;
  readonly explanationVersion: string | null;
  readonly inputDigest: string | null;
  readonly supersedesRiskAssessmentId: EntityId | null;
  readonly recalculationReason: string | null;
  readonly isCurrent: boolean;
  readonly undeterminedReasonCategory: string | null;
  readonly developmentBanner: string | null;
  readonly explanationDetail: string | null;
  readonly aggregationStrategy: string | null;
  readonly aggregationStrategyVersion: number | null;
};

export type RiskFactor = RecordMetadata & {
  readonly riskAssessmentId: EntityId;
  readonly factorCode: string;
  readonly factorLabel: string;
  readonly sourceQuestionKey: string | null;
  readonly severity: string | null;
  readonly ruleVersion: string | null;
  readonly ruleId: string | null;
  readonly priority: RiskPriority | null;
  readonly explanationId: string | null;
  readonly sortOrder: number;
  readonly sourceMeasurementId: EntityId | null;
};

export type Referral = RecordMetadata & {
  readonly clientId: EntityId;
  readonly encounterId: EntityId | null;
  readonly riskAssessmentId: EntityId | null;
  readonly sourceFacilityId: EntityId | null;
  readonly receivingFacilityId: EntityId | null;
  readonly priority: RiskPriority;
  readonly reasonSummary: string | null;
  readonly transportStatus: TransportStatus;
  readonly caregiverInformed: boolean;
  readonly status: ReferralStatus;
  readonly completedAt: IsoUtcTimestamp | null;
  readonly qrPayloadVersion: number | null;
  readonly referenceCode: string | null;
  readonly origin: ReferralOrigin;
  readonly reasonCode: string | null;
  readonly reasonContentStatus: string | null;
  readonly prioritySource: ReferralPrioritySource;
  readonly communicationNotes: string | null;
  readonly workerNotes: string | null;
  readonly activePassportId: EntityId | null;
};

export type ReferralEvent = RecordMetadata & {
  readonly referralId: EntityId;
  readonly eventType: string;
  readonly occurredAt: IsoUtcTimestamp;
  readonly recordedByAccountId: EntityId | null;
  readonly facilityId: EntityId | null;
  readonly notes: string | null;
};

/** Opaque QR passport — token_hash only; never store raw token. */
export type ReferralPassport = RecordMetadata & {
  readonly referralId: EntityId;
  readonly tokenHash: string;
  readonly status: ReferralPassportStatus;
  readonly payloadVersion: number;
  readonly issuedAt: IsoUtcTimestamp;
  readonly expiresAt: IsoUtcTimestamp | null;
  readonly revokedAt: IsoUtcTimestamp | null;
  readonly revokedReason: string | null;
  readonly supersededByPassportId: EntityId | null;
};

export type NutritionAssessment = RecordMetadata & {
  readonly clientId: EntityId;
  readonly encounterId: EntityId | null;
  readonly assessmentDate: DateOnly;
  readonly assessmentType: string | null;
  readonly templateId: string | null;
  readonly templateVersion: number | null;
  readonly facilityId: EntityId | null;
  readonly startedAt: IsoUtcTimestamp | null;
  readonly completedAt: IsoUtcTimestamp | null;
  readonly confirmedByAccountId: EntityId | null;
  readonly confirmedAt: IsoUtcTimestamp | null;
  readonly followUpSource: string | null;
  readonly progressSectionId: string | null;
  readonly supersededById: EntityId | null;
  readonly supersedesId: EntityId | null;
  readonly engineVersion: number | null;
  readonly discardReason: string | null;
  /** Legacy Stage 6 columns — prefer structured answers for Stage 12 workflows. */
  readonly breastfeedingStatus: string | null;
  readonly complementaryFeedingStatus: string | null;
  readonly mealsPerDay: number | null;
  readonly foodDiversityScore: number | null;
  readonly guidanceContentVersion: string | null;
  readonly followUpDate: DateOnly | null;
  readonly status: NutritionStatus;
};

export type NutritionAssessmentAnswer = RecordMetadata & {
  readonly nutritionAssessmentId: EntityId;
  readonly questionKey: string;
  readonly valueType: AnswerValueType;
  readonly booleanValue: boolean | null;
  readonly numberValue: number | null;
  readonly textValue: string | null;
  readonly dateValue: DateOnly | null;
  readonly optionValue: string | null;
  readonly multipleOptionsJson: string | null;
};

export type NutritionMeasurementLink = RecordMetadata & {
  readonly nutritionAssessmentId: EntityId;
  readonly measurementId: EntityId;
  readonly questionKey: string | null;
  readonly linkRole: string;
};

export type NutritionReferenceResult = RecordMetadata & {
  readonly nutritionAssessmentId: EntityId;
  readonly referencePackId: string;
  readonly referencePackVersion: number;
  readonly engineVersion: number;
  readonly resultStatus: string;
  readonly interpretationCode: string | null;
  readonly derivedValue: number | null;
  readonly derivedUnit: string | null;
  readonly missingInformationJson: string | null;
  readonly inputMeasurementIdsJson: string | null;
  readonly explanationId: string | null;
  readonly growthIndicatorsJson: string | null;
  readonly calculatedAt: IsoUtcTimestamp;
  readonly supersedesResultId: EntityId | null;
  readonly isDevelopment: boolean;
};

export type NutritionGuidanceResolution = RecordMetadata & {
  readonly nutritionAssessmentId: EntityId;
  readonly guidancePackId: string | null;
  readonly guidancePackVersion: number | null;
  readonly resolutionStatus: string;
  readonly guidanceIdsJson: string | null;
  readonly resolvedAt: IsoUtcTimestamp;
  readonly acknowledgedByAccountId: EntityId | null;
  readonly acknowledgedAt: IsoUtcTimestamp | null;
  readonly supersedesResolutionId: EntityId | null;
  readonly isDevelopment: boolean;
};

export type Attachment = RecordMetadata & {
  readonly ownerType: string;
  readonly ownerId: EntityId;
  readonly fileUri: string;
  readonly mimeType: string | null;
  readonly fileSize: number | null;
  readonly checksum: string | null;
  readonly encryptionStatus: AttachmentEncryptionStatus;
  readonly uploadStatus: AttachmentUploadStatus;
  /** Optional Stage 11 voice metadata — null for non-audio attachments. */
  readonly durationMs: number | null;
  readonly audioFormatVersion: number | null;
  readonly originalFilename: string | null;
};

export type SyncQueueItem = {
  readonly id: EntityId;
  /** Stable protocol id; retries must reuse this value. */
  readonly operationId: EntityId | null;
  readonly entityType: string;
  readonly entityId: EntityId;
  readonly operation: SyncQueueOperation;
  readonly payloadVersion: number;
  readonly state: SyncQueueState;
  readonly attemptCount: number;
  readonly nextAttemptAt: IsoUtcTimestamp | null;
  readonly lastAttemptAt: IsoUtcTimestamp | null;
  readonly lastErrorCategory: string | null;
  readonly createdAt: IsoUtcTimestamp;
  readonly updatedAt: IsoUtcTimestamp;
  readonly priority: number;
  /** Sanitised entity snapshot only; never credentials or raw QR data. */
  readonly payloadJson: string | null;
  readonly baseServerVersion: number | null;
  readonly clientLocalVersion: number | null;
  readonly requestHash: string | null;
  readonly occurredAt: IsoUtcTimestamp | null;
};

export type AuditEvent = {
  readonly id: EntityId;
  readonly eventType: string;
  readonly entityType: string;
  readonly entityId: EntityId | null;
  readonly actorAccountId: EntityId | null;
  readonly occurredAt: IsoUtcTimestamp;
  readonly result: string;
  readonly metadataJson: string | null;
};
