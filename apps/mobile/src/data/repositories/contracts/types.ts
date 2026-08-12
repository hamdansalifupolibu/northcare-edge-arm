import type {
  Attachment,
  AuditEvent,
  Caregiver,
  Client,
  ClientRelationship,
  Encounter,
  Facility,
  LocalAccountReference,
  Measurement,
  Referral,
  ReferralEvent,
  ReferralPassport,
  RiskAssessment,
  RiskFactor,
  Screening,
  ScreeningAnswer,
  SyncQueueItem,
} from '../../domain/entities/entities';
import type { AgeUnit } from '../../domain/enums/ageUnit';
import type { ClientCategory } from '../../domain/enums/clientCategory';
import type {
  AnswerValueType,
  ConsentStatus,
  EncounterType,
  ReferralStatus,
  RelationshipType,
  RiskPriority,
  ScreeningType,
  SyncQueueOperation,
  SyncQueueState,
} from '../../domain/enums/domainEnums';
import type { EntityId } from '../../domain/value-objects/EntityId';
import type { DateOnly } from '../../domain/value-objects/dateOnly';
import type { SoftDeleteOptions } from '../../domain/value-objects/RecordMetadata';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { AssistantFeedbackRepository } from './assistantTypes';
import type { AssistantConversationRepository } from './assistantConversationTypes';
import type {
  FollowUpReminderRepository,
  NotificationPreferencesRepository,
} from './reminderTypes';
import type { NutritionAssessmentRepository } from './nutritionTypes';
import type {
  VoiceCaptureSessionRepository,
  VoiceExtractionRunRepository,
  VoiceExtractionSuggestionRepository,
  VoiceTranscriptRepository,
} from './voiceTypes';
import type { AdminProvisioningRepository } from '../sqlite/sqliteAdminProvisioningRepository';

export type CreateFacilityInput = {
  readonly id?: EntityId;
  readonly name: string;
  readonly externalCode?: string | null;
  readonly facilityType?: string | null;
  readonly district?: string | null;
  readonly region?: string | null;
  readonly isActive?: boolean;
};

export type FacilityRepository = {
  create(input: CreateFacilityInput): Promise<Facility>;
  findById(id: EntityId, options?: SoftDeleteOptions): Promise<Facility | null>;
  findByExternalCode(externalCode: string, options?: SoftDeleteOptions): Promise<Facility | null>;
  listActive(): Promise<Facility[]>;
};

export type UpsertLocalAccountInput = {
  readonly accountId: EntityId;
  readonly role: LocalAccountReference['role'];
  readonly facilityId?: EntityId | null;
  readonly displayName: string;
};

export type LocalAccountReferenceRepository = {
  upsert(input: UpsertLocalAccountInput): Promise<LocalAccountReference>;
  findById(accountId: EntityId): Promise<LocalAccountReference | null>;
};

export type CreateClientInput = {
  readonly id?: EntityId;
  readonly clientCode: string;
  readonly category: ClientCategory;
  readonly givenName: string;
  readonly familyName: string;
  readonly preferredName?: string | null;
  readonly sex?: string | null;
  readonly dateOfBirth?: DateOnly | null;
  readonly approximateAge?: number | null;
  readonly approximateAgeUnit?: AgeUnit | null;
  readonly pregnancyStatus?: string | null;
  readonly estimatedDeliveryDate?: DateOnly | null;
  readonly phoneNumber?: string | null;
  readonly community?: string | null;
  readonly district?: string | null;
  readonly region?: string | null;
  readonly primaryFacilityId?: EntityId | null;
  readonly consentStatus?: ConsentStatus;
  readonly notes?: string | null;
  readonly accountId?: EntityId | null;
};

export type UpdateClientInput = {
  readonly id: EntityId;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly preferredName?: string | null;
  readonly category?: ClientCategory;
  readonly sex?: string | null;
  readonly dateOfBirth?: DateOnly | null;
  readonly approximateAge?: number | null;
  readonly approximateAgeUnit?: AgeUnit | null;
  readonly phoneNumber?: string | null;
  readonly community?: string | null;
  readonly district?: string | null;
  readonly region?: string | null;
  readonly primaryFacilityId?: EntityId | null;
  readonly pregnancyStatus?: string | null;
  readonly estimatedDeliveryDate?: DateOnly | null;
  readonly consentStatus?: ConsentStatus;
  readonly notes?: string | null;
  readonly accountId?: EntityId | null;
  /** When set, reject update if the stored local_version differs. */
  readonly expectedLocalVersion?: number;
};

export type ListClientsOptions = SoftDeleteOptions & {
  readonly query?: string;
  readonly category?: ClientCategory | null;
  readonly facilityId?: EntityId | null;
};

export type ClientRepository = {
  create(input: CreateClientInput): Promise<Client>;
  findById(id: EntityId, options?: SoftDeleteOptions): Promise<Client | null>;
  findByClientCode(clientCode: string, options?: SoftDeleteOptions): Promise<Client | null>;
  search(query: string, options?: SoftDeleteOptions): Promise<Client[]>;
  list(options?: ListClientsOptions): Promise<Client[]>;
  update(input: UpdateClientInput): Promise<Client>;
  archive(id: EntityId, accountId?: EntityId | null): Promise<Client>;
  listByFacility(facilityId: EntityId, options?: SoftDeleteOptions): Promise<Client[]>;
};

export type CreateCaregiverInput = {
  readonly id?: EntityId;
  readonly givenName: string;
  readonly familyName: string;
  readonly phoneNumber?: string | null;
  readonly community?: string | null;
  readonly notes?: string | null;
  readonly accountId?: EntityId | null;
};

export type CreateRelationshipInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly caregiverId: EntityId;
  readonly relationshipType: RelationshipType;
  readonly isPrimary?: boolean;
  readonly accountId?: EntityId | null;
};

export type CaregiverRepository = {
  create(input: CreateCaregiverInput): Promise<Caregiver>;
  findById(id: EntityId, options?: SoftDeleteOptions): Promise<Caregiver | null>;
  createRelationship(input: CreateRelationshipInput): Promise<ClientRelationship>;
  listRelationshipsForClient(
    clientId: EntityId,
    options?: SoftDeleteOptions,
  ): Promise<ClientRelationship[]>;
};

export type CreateDraftEncounterInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly encounterType: EncounterType;
  readonly facilityId?: EntityId | null;
  readonly workerAccountId?: EntityId | null;
  readonly notes?: string | null;
  readonly accountId?: EntityId | null;
};

export type TouchDraftEncounterInput = {
  readonly id: EntityId;
  readonly accountId?: EntityId | null;
  /** Non-clinical progress marker only (section id). Never store answers here. */
  readonly progressSectionId?: string | null;
};

export type AppendControlledVisitNoteInput = {
  readonly id: EntityId;
  readonly noteText: string;
  readonly accountId?: EntityId | null;
};

export type EncounterRepository = {
  createDraft(input: CreateDraftEncounterInput): Promise<Encounter>;
  findDraftById(id: EntityId): Promise<Encounter | null>;
  findActiveDraftByClient(clientId: EntityId): Promise<Encounter | null>;
  findById(id: EntityId, options?: SoftDeleteOptions): Promise<Encounter | null>;
  listByClient(clientId: EntityId, options?: SoftDeleteOptions): Promise<Encounter[]>;
  touchDraftSaved(input: TouchDraftEncounterInput): Promise<Encounter>;
  /** Appends a controlled worker note without clearing progress markers. */
  appendControlledVisitNote(input: AppendControlledVisitNoteInput): Promise<Encounter>;
  markInProgress(id: EntityId, accountId?: EntityId | null): Promise<Encounter>;
  complete(id: EntityId, accountId?: EntityId | null): Promise<Encounter>;
  cancel(id: EntityId, accountId?: EntityId | null): Promise<Encounter>;
};

export type CreateScreeningInput = {
  readonly id?: EntityId;
  readonly encounterId: EntityId;
  readonly clientId: EntityId;
  readonly screeningType: ScreeningType;
  readonly schemaVersion?: number;
  readonly accountId?: EntityId | null;
};

export type SaveAnswerInput = {
  readonly id?: EntityId;
  readonly screeningId: EntityId;
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

export type ScreeningRepository = {
  create(input: CreateScreeningInput): Promise<Screening>;
  findById(id: EntityId, options?: SoftDeleteOptions): Promise<Screening | null>;
  findByEncounterId(
    encounterId: EntityId,
    options?: SoftDeleteOptions,
  ): Promise<Screening | null>;
  saveAnswer(input: SaveAnswerInput): Promise<ScreeningAnswer>;
  listAnswers(screeningId: EntityId): Promise<ScreeningAnswer[]>;
  markInProgress(id: EntityId, accountId?: EntityId | null): Promise<Screening>;
  complete(id: EntityId, accountId?: EntityId | null): Promise<Screening>;
  cancel(id: EntityId, accountId?: EntityId | null): Promise<Screening>;
};

export type CreateMeasurementInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly encounterId?: EntityId | null;
  readonly screeningId?: EntityId | null;
  readonly measurementType: Measurement['measurementType'];
  readonly numericValue: number;
  readonly unit: Measurement['unit'];
  readonly measuredAt?: IsoUtcTimestamp;
  readonly accountId?: EntityId | null;
  readonly notes?: string | null;
};

export type MeasurementRepository = {
  create(input: CreateMeasurementInput): Promise<Measurement>;
  listByClient(clientId: EntityId): Promise<Measurement[]>;
  listByEncounter(encounterId: EntityId): Promise<Measurement[]>;
  listByScreening(screeningId: EntityId): Promise<Measurement[]>;
};

export type CreateRiskAssessmentInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly encounterId?: EntityId | null;
  readonly screeningId?: EntityId | null;
  readonly priority: RiskPriority;
  readonly ruleSetVersion: string;
  readonly explanationSummary?: string | null;
  readonly missingInformation?: string | null;
  readonly evaluationStatus?: string;
  readonly engineVersion?: number;
  readonly rulePackId?: string | null;
  readonly rulePackVersion?: number | null;
  readonly screeningTemplateId?: string | null;
  readonly screeningTemplateVersion?: number | null;
  readonly explanationVersion?: string | null;
  readonly inputDigest?: string | null;
  readonly supersedesRiskAssessmentId?: EntityId | null;
  readonly recalculationReason?: string | null;
  readonly isCurrent?: boolean;
  readonly undeterminedReasonCategory?: string | null;
  readonly developmentBanner?: string | null;
  readonly explanationDetail?: string | null;
  readonly aggregationStrategy?: string | null;
  readonly aggregationStrategyVersion?: number | null;
  readonly calculatedAt?: IsoUtcTimestamp;
  readonly factors?: readonly {
    readonly factorCode: string;
    readonly factorLabel: string;
    readonly sourceQuestionKey?: string | null;
    readonly severity?: string | null;
    readonly ruleVersion?: string | null;
    readonly ruleId?: string | null;
    readonly priority?: RiskPriority | null;
    readonly explanationId?: string | null;
    readonly sortOrder?: number;
    readonly sourceMeasurementId?: EntityId | null;
  }[];
  readonly accountId?: EntityId | null;
  /** When true, caller already opened a transaction (no nested BEGIN). */
  readonly alreadyInTransaction?: boolean;
};

export type RiskAssessmentRepository = {
  createWithFactors(input: CreateRiskAssessmentInput): Promise<{
    readonly assessment: RiskAssessment;
    readonly factors: readonly RiskFactor[];
  }>;
  findById(id: EntityId): Promise<RiskAssessment | null>;
  findCurrentByScreeningId(screeningId: EntityId): Promise<RiskAssessment | null>;
  findCurrentByEncounterId(encounterId: EntityId): Promise<RiskAssessment | null>;
  listByScreeningId(screeningId: EntityId): Promise<readonly RiskAssessment[]>;
  listFactors(riskAssessmentId: EntityId): Promise<readonly RiskFactor[]>;
  acknowledge(input: {
    readonly id: EntityId;
    readonly accountId: EntityId;
    readonly confirmedAt?: IsoUtcTimestamp;
  }): Promise<RiskAssessment>;
  markSuperseded(input: {
    readonly id: EntityId;
    readonly accountId?: EntityId | null;
  }): Promise<RiskAssessment>;
};

export type CreateReferralDraftInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly encounterId?: EntityId | null;
  readonly riskAssessmentId?: EntityId | null;
  readonly sourceFacilityId?: EntityId | null;
  readonly receivingFacilityId?: EntityId | null;
  readonly priority: RiskPriority;
  readonly reasonSummary?: string | null;
  readonly referenceCode?: string | null;
  readonly origin?: Referral['origin'];
  readonly reasonCode?: string | null;
  readonly reasonContentStatus?: string | null;
  readonly prioritySource?: Referral['prioritySource'];
  readonly communicationNotes?: string | null;
  readonly workerNotes?: string | null;
  readonly transportStatus?: Referral['transportStatus'];
  readonly accountId?: EntityId | null;
};

export type UpdateReferralDraftInput = {
  readonly id: EntityId;
  readonly receivingFacilityId?: EntityId | null;
  readonly priority?: RiskPriority;
  readonly reasonSummary?: string | null;
  readonly reasonCode?: string | null;
  readonly reasonContentStatus?: string | null;
  readonly communicationNotes?: string | null;
  readonly workerNotes?: string | null;
  readonly transportStatus?: Referral['transportStatus'];
  readonly caregiverInformed?: boolean;
  readonly accountId?: EntityId | null;
};

export type AddReferralEventInput = {
  readonly id?: EntityId;
  readonly referralId: EntityId;
  readonly eventType: string;
  readonly occurredAt?: IsoUtcTimestamp;
  readonly facilityId?: EntityId | null;
  readonly notes?: string | null;
  readonly accountId?: EntityId | null;
};

export type ReferralWriteOptions = {
  /** When true, caller already holds the SQLite transaction (nested BEGIN unsafe). */
  readonly alreadyInTransaction?: boolean;
};

export type ReferralRepository = {
  createDraft(input: CreateReferralDraftInput): Promise<Referral>;
  updateDraft(input: UpdateReferralDraftInput): Promise<Referral>;
  /** Update destination, reason, and notes on a confirmed active referral. */
  updateDetails(input: UpdateReferralDraftInput): Promise<Referral>;
  addEvent(input: AddReferralEventInput): Promise<ReferralEvent>;
  updateStatus(
    id: EntityId,
    status: ReferralStatus,
    accountId?: EntityId | null,
    options?: ReferralWriteOptions,
  ): Promise<Referral>;
  setActivePassport(
    id: EntityId,
    passportId: EntityId | null,
    qrPayloadVersion: number | null,
    accountId?: EntityId | null,
  ): Promise<Referral>;
  findById(id: EntityId, options?: SoftDeleteOptions): Promise<Referral | null>;
  findByReferenceCode(referenceCode: string): Promise<Referral | null>;
  listByClient(clientId: EntityId, options?: SoftDeleteOptions): Promise<Referral[]>;
  listPending(): Promise<Referral[]>;
  listOverdue(): Promise<Referral[]>;
  listRecent(limit?: number): Promise<Referral[]>;
  listEvents(referralId: EntityId): Promise<ReferralEvent[]>;
  cancel(id: EntityId, accountId?: EntityId | null): Promise<Referral>;
};

export type CreateReferralPassportInput = {
  readonly id?: EntityId;
  readonly referralId: EntityId;
  readonly tokenHash: string;
  readonly payloadVersion?: number;
  readonly issuedAt?: IsoUtcTimestamp;
  readonly expiresAt?: IsoUtcTimestamp | null;
  readonly accountId?: EntityId | null;
};

export type ReferralPassportRepository = {
  create(input: CreateReferralPassportInput): Promise<ReferralPassport>;
  findById(id: EntityId): Promise<ReferralPassport | null>;
  findActiveByReferralId(referralId: EntityId): Promise<ReferralPassport | null>;
  findByTokenHash(tokenHash: string): Promise<ReferralPassport | null>;
  listByReferralId(referralId: EntityId): Promise<ReferralPassport[]>;
  revoke(input: {
    readonly id: EntityId;
    readonly reason: string;
    readonly accountId?: EntityId | null;
  }): Promise<ReferralPassport>;
  markSuperseded(input: {
    readonly id: EntityId;
    readonly supersededByPassportId: EntityId;
    readonly accountId?: EntityId | null;
  }): Promise<ReferralPassport>;
  markExpired(id: EntityId, accountId?: EntityId | null): Promise<ReferralPassport>;
};

export type CreateAttachmentInput = {
  readonly id?: EntityId;
  readonly ownerType: string;
  readonly ownerId: EntityId;
  readonly fileUri: string;
  readonly mimeType?: string | null;
  readonly fileSize?: number | null;
  readonly checksum?: string | null;
  readonly durationMs?: number | null;
  readonly audioFormatVersion?: number | null;
  readonly originalFilename?: string | null;
  readonly accountId?: EntityId | null;
};

export type AttachmentRepository = {
  create(input: CreateAttachmentInput): Promise<Attachment>;
  findById(id: EntityId): Promise<Attachment | null>;
  listByOwner(ownerType: string, ownerId: EntityId): Promise<Attachment[]>;
  softDelete(id: EntityId, accountId?: EntityId | null): Promise<void>;
};

export type EnqueueSyncInput = {
  readonly id?: EntityId;
  /** Optional only for legacy records; new queue entries always receive one. */
  readonly operationId?: EntityId;
  readonly entityType: string;
  readonly entityId: EntityId;
  readonly operation: SyncQueueOperation;
  readonly payloadVersion?: number;
  readonly priority?: number;
  readonly nextAttemptAt?: IsoUtcTimestamp | null;
  readonly payloadJson?: string | null;
  readonly baseServerVersion?: number | null;
  readonly clientLocalVersion?: number | null;
  readonly requestHash?: string | null;
  readonly occurredAt?: IsoUtcTimestamp | null;
};

export type SyncQueueRepository = {
  enqueue(input: EnqueueSyncInput): Promise<SyncQueueItem>;
  findById(id: EntityId): Promise<SyncQueueItem | null>;
  listByState(state: SyncQueueState): Promise<SyncQueueItem[]>;
  listReady(now: IsoUtcTimestamp): Promise<SyncQueueItem[]>;
  incrementAttempts(id: EntityId, errorCategory?: string | null): Promise<SyncQueueItem>;
  scheduleRetry(id: EntityId, nextAttemptAt: IsoUtcTimestamp): Promise<SyncQueueItem>;
  markFailed(id: EntityId, errorCategory: string): Promise<SyncQueueItem>;
  markConflict(id: EntityId): Promise<SyncQueueItem>;
  markCompleted(id: EntityId): Promise<SyncQueueItem>;
  setProtocolPayload(input: {
    readonly id: EntityId;
    readonly payloadJson: string;
    readonly baseServerVersion: number | null;
    readonly clientLocalVersion: number;
    readonly requestHash: string;
    readonly occurredAt: IsoUtcTimestamp;
  }): Promise<SyncQueueItem>;
};

export type SyncStateRepository = {
  get(scopeKey: string): Promise<{
    readonly pullCursor: string | null;
    readonly deviceId: string | null;
    readonly lastSyncAt: IsoUtcTimestamp | null;
    readonly lastSyncErrorCategory: string | null;
  } | null>;
  upsert(input: {
    readonly scopeKey: string;
    readonly pullCursor?: string | null;
    readonly deviceId?: string | null;
    readonly lastSyncAt?: IsoUtcTimestamp | null;
    readonly lastSyncErrorCategory?: string | null;
  }): Promise<void>;
};

export type SyncConflictRepository = {
  listOpen(): Promise<readonly {
    readonly id: string;
    readonly serverConflictId: string | null;
    readonly entityType: string;
    readonly entityId: string;
    readonly conflictClass: string;
    readonly state: 'open' | 'resolved' | 'keptForReview';
  }[]>;
  upsert(input: {
    readonly id: string;
    readonly serverConflictId?: string | null;
    readonly entityType: string;
    readonly entityId: string;
    readonly conflictClass: string;
    readonly localOperationId?: string | null;
    readonly localPayloadJson?: string | null;
    readonly serverPayloadJson?: string | null;
    readonly serverVersion?: number | null;
    readonly state: 'open' | 'resolved' | 'keptForReview';
    readonly resolutionAction?: string | null;
  }): Promise<void>;
  resolve(id: string, state: 'resolved' | 'keptForReview', resolutionAction: string): Promise<void>;
};

export type RecordAuditEventInput = {
  readonly id?: EntityId;
  readonly eventType: string;
  readonly entityType: string;
  readonly entityId?: EntityId | null;
  readonly actorAccountId?: EntityId | null;
  readonly result: string;
  readonly metadata?: Readonly<Record<string, unknown>> | null;
};

export type ListRecentAuditEventsInput = {
  readonly limit?: number;
  readonly eventType?: string | null;
  readonly entityType?: string | null;
};

export type AuditEventRepository = {
  record(input: RecordAuditEventInput): Promise<AuditEvent>;
  listForEntity(entityType: string, entityId: EntityId): Promise<AuditEvent[]>;
  listRecent(input?: ListRecentAuditEventsInput): Promise<AuditEvent[]>;
};

export type RepositoryContainer = {
  readonly facilities: FacilityRepository;
  readonly localAccounts: LocalAccountReferenceRepository;
  readonly clients: ClientRepository;
  readonly caregivers: CaregiverRepository;
  readonly encounters: EncounterRepository;
  readonly screenings: ScreeningRepository;
  readonly measurements: MeasurementRepository;
  readonly riskAssessments: RiskAssessmentRepository;
  readonly referrals: ReferralRepository;
  readonly referralPassports: ReferralPassportRepository;
  readonly nutritionAssessments: NutritionAssessmentRepository;
  readonly assistantFeedback: AssistantFeedbackRepository;
  readonly assistantConversations: AssistantConversationRepository;
  readonly attachments: AttachmentRepository;
  readonly syncQueue: SyncQueueRepository;
  readonly syncState: SyncStateRepository;
  readonly syncConflicts: SyncConflictRepository;
  readonly auditEvents: AuditEventRepository;
  readonly voiceCaptureSessions: VoiceCaptureSessionRepository;
  readonly voiceExtractionRuns: VoiceExtractionRunRepository;
  readonly voiceExtractionSuggestions: VoiceExtractionSuggestionRepository;
  readonly voiceTranscripts: VoiceTranscriptRepository;
  readonly followUpReminders: FollowUpReminderRepository;
  readonly notificationPreferences: NotificationPreferencesRepository;
  readonly adminProvisioning: AdminProvisioningRepository;
};

export type {
  AssistantFeedbackRecord,
  AssistantFeedbackRepository,
  CreateAssistantFeedbackInput,
} from './assistantTypes';

export type {
  CreateNutritionAssessmentInput,
  NutritionAssessmentRepository,
  SaveNutritionAnswerInput,
  UpdateNutritionAssessmentInput,
} from './nutritionTypes';
export type {
  VoiceCaptureSessionRepository,
  VoiceExtractionRunRepository,
  VoiceExtractionSuggestionRepository,
  VoiceTranscriptRepository,
} from './voiceTypes';
export type {
  CreateFollowUpReminderInput,
  FollowUpReminderRepository,
  NotificationPreferencesRepository,
} from './reminderTypes';
