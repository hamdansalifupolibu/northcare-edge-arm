import type { ConsentStatus } from '../../domain/enums/domainEnums';
import type { EntityId } from '../../domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { RecordingState } from '../../../features/voice/domain/states';
import type {
  VoiceCaptureSession,
  VoiceCaptureSessionStatus,
  VoiceConfidenceCategory,
  VoiceExtractionRun,
  VoiceExtractionRunStatus,
  VoiceExtractionSuggestion,
  VoiceRejectionReasonCode,
  VoiceRetentionStatus,
  VoiceSuggestionReviewStatus,
  VoiceSuggestionValueType,
  VoiceAllowedTargetType,
  VoiceTranscript,
  VoiceTranscriptSource,
  VoiceTranscriptStatus,
} from '../../../features/voice/domain/types';

export type CreateVoiceCaptureSessionInput = {
  readonly id?: EntityId;
  readonly clientId: EntityId;
  readonly encounterId?: EntityId | null;
  readonly status?: VoiceCaptureSessionStatus;
  readonly uiState?: RecordingState;
  readonly consentStatus?: ConsentStatus;
  readonly languageHint?: string | null;
  readonly accountId?: EntityId | null;
};

export type UpdateVoiceCaptureSessionInput = {
  readonly id: EntityId;
  readonly attachmentId?: EntityId | null;
  readonly status?: VoiceCaptureSessionStatus;
  readonly uiState?: RecordingState;
  readonly consentStatus?: ConsentStatus;
  readonly consentVersion?: string | null;
  readonly languageHint?: string | null;
  readonly durationMs?: number | null;
  readonly audioFormatVersion?: number | null;
  readonly transcriptionProviderId?: string | null;
  readonly transcriptionProviderVersion?: string | null;
  readonly extractionProviderId?: string | null;
  readonly extractionProviderVersion?: string | null;
  readonly retentionStatus?: VoiceRetentionStatus;
  readonly completedAt?: IsoUtcTimestamp | null;
  readonly discardedAt?: IsoUtcTimestamp | null;
  readonly accountId?: EntityId | null;
};

export type VoiceCaptureSessionRepository = {
  create(input: CreateVoiceCaptureSessionInput): Promise<VoiceCaptureSession>;
  findById(id: EntityId): Promise<VoiceCaptureSession | null>;
  listByClient(clientId: EntityId): Promise<VoiceCaptureSession[]>;
  listRecentByAccount(input: {
    readonly accountId: EntityId;
    readonly clientId?: EntityId | null;
    readonly includeDiscarded?: boolean;
    readonly limit?: number;
  }): Promise<VoiceCaptureSession[]>;
  update(input: UpdateVoiceCaptureSessionInput): Promise<VoiceCaptureSession>;
};

export type CreateVoiceTranscriptInput = {
  readonly id?: EntityId;
  readonly voiceCaptureSessionId: EntityId;
  readonly transcriptText: string;
  readonly languageCode?: string | null;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly source: VoiceTranscriptSource;
  readonly status: VoiceTranscriptStatus;
  readonly isPartial: boolean;
  readonly isSynthetic: boolean;
  readonly accountId?: EntityId | null;
};

export type VoiceTranscriptRepository = {
  create(input: CreateVoiceTranscriptInput): Promise<VoiceTranscript>;
  findById(id: EntityId): Promise<VoiceTranscript | null>;
  listBySession(sessionId: EntityId): Promise<VoiceTranscript[]>;
  confirm(input: {
    readonly id: EntityId;
    readonly transcriptText?: string | null;
    readonly accountId?: EntityId | null;
  }): Promise<VoiceTranscript>;
};

export type CreateVoiceExtractionRunInput = {
  readonly id?: EntityId;
  readonly voiceCaptureSessionId: EntityId;
  readonly transcriptId: EntityId;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly extractionSchemaId: string;
  readonly extractionSchemaVersion: number;
  readonly status: VoiceExtractionRunStatus;
  readonly completedAt?: IsoUtcTimestamp | null;
  readonly accountId?: EntityId | null;
};

export type VoiceExtractionRunRepository = {
  create(input: CreateVoiceExtractionRunInput): Promise<VoiceExtractionRun>;
  findById(id: EntityId): Promise<VoiceExtractionRun | null>;
  listBySession(sessionId: EntityId): Promise<VoiceExtractionRun[]>;
};

export type CreateVoiceSuggestionInput = {
  readonly id?: EntityId;
  readonly extractionRunId: EntityId;
  readonly targetType: VoiceAllowedTargetType;
  readonly targetKey: string;
  readonly proposedValueJson: string;
  readonly valueType: VoiceSuggestionValueType;
  readonly sourceStart?: number | null;
  readonly sourceEnd?: number | null;
  readonly sourceTextHash?: string | null;
  readonly confidenceCategory: VoiceConfidenceCategory;
  readonly accountId?: EntityId | null;
};

export type UpdateVoiceSuggestionReviewInput = {
  readonly id: EntityId;
  readonly reviewStatus: VoiceSuggestionReviewStatus;
  readonly confirmedValueJson?: string | null;
  readonly rejectionReasonCode?: VoiceRejectionReasonCode | null;
  readonly accountId?: EntityId | null;
};

export type VoiceExtractionSuggestionRepository = {
  create(input: CreateVoiceSuggestionInput): Promise<VoiceExtractionSuggestion>;
  createMany(
    inputs: readonly CreateVoiceSuggestionInput[],
  ): Promise<VoiceExtractionSuggestion[]>;
  findById(id: EntityId): Promise<VoiceExtractionSuggestion | null>;
  listByRun(runId: EntityId): Promise<VoiceExtractionSuggestion[]>;
  updateReview(input: UpdateVoiceSuggestionReviewInput): Promise<VoiceExtractionSuggestion>;
};
