import type { ConsentStatus } from '../../../data/domain/enums/domainEnums';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../../data/domain/value-objects/timestamps';
import type { RecordingState } from './states';

export const VOICE_CAPTURE_SESSION_STATUSES = [
  'draft',
  'consentPending',
  'readyToRecord',
  'recording',
  'recorded',
  'transcribing',
  'transcriptReady',
  'extracting',
  'reviewRequired',
  'confirmed',
  'discarded',
  'failed',
] as const;
export type VoiceCaptureSessionStatus = (typeof VOICE_CAPTURE_SESSION_STATUSES)[number];

export const VOICE_RETENTION_STATUSES = [
  'pendingDecision',
  'retained',
  'deleted',
  'deleteFailed',
] as const;
export type VoiceRetentionStatus = (typeof VOICE_RETENTION_STATUSES)[number];

export const VOICE_TRANSCRIPT_STATUSES = [
  'draft',
  'readyForReview',
  'confirmed',
  'rejected',
  'failed',
] as const;
export type VoiceTranscriptStatus = (typeof VOICE_TRANSCRIPT_STATUSES)[number];

export const VOICE_TRANSCRIPT_SOURCES = ['provider', 'manual', 'developmentSimulation'] as const;
export type VoiceTranscriptSource = (typeof VOICE_TRANSCRIPT_SOURCES)[number];

export const VOICE_EXTRACTION_RUN_STATUSES = [
  'pending',
  'completed',
  'failed',
  'cancelled',
] as const;
export type VoiceExtractionRunStatus = (typeof VOICE_EXTRACTION_RUN_STATUSES)[number];

export const VOICE_SUGGESTION_REVIEW_STATUSES = [
  'pendingReview',
  'accepted',
  'edited',
  'rejected',
] as const;
export type VoiceSuggestionReviewStatus = (typeof VOICE_SUGGESTION_REVIEW_STATUSES)[number];

export const VOICE_CONFIDENCE_CATEGORIES = [
  'high',
  'medium',
  'low',
  'uncertain',
  'unknown',
] as const;
export type VoiceConfidenceCategory = (typeof VOICE_CONFIDENCE_CATEGORIES)[number];

export const VOICE_SUGGESTION_VALUE_TYPES = [
  'boolean',
  'number',
  'text',
  'option',
  'measurement',
  'note',
] as const;
export type VoiceSuggestionValueType = (typeof VOICE_SUGGESTION_VALUE_TYPES)[number];

export const VOICE_ALLOWED_TARGET_TYPES = [
  'encounterContext',
  'screeningDraftAnswer',
  'measurementDraft',
  'controlledVisitNote',
  'followUpDraft',
] as const;
export type VoiceAllowedTargetType = (typeof VOICE_ALLOWED_TARGET_TYPES)[number];

export const VOICE_REJECTION_REASON_CODES = [
  'incorrect',
  'notDiscussed',
  'unsafeInference',
  'wrongField',
  'other',
] as const;
export type VoiceRejectionReasonCode = (typeof VOICE_REJECTION_REASON_CODES)[number];

export type VoiceCaptureSession = {
  readonly id: EntityId;
  readonly clientId: EntityId;
  readonly encounterId: EntityId | null;
  readonly attachmentId: EntityId | null;
  readonly status: VoiceCaptureSessionStatus;
  readonly uiState: RecordingState;
  readonly consentStatus: ConsentStatus;
  readonly consentVersion: string | null;
  readonly languageHint: string | null;
  readonly durationMs: number | null;
  readonly audioFormatVersion: number | null;
  readonly transcriptionProviderId: string | null;
  readonly transcriptionProviderVersion: string | null;
  readonly extractionProviderId: string | null;
  readonly extractionProviderVersion: string | null;
  readonly retentionStatus: VoiceRetentionStatus;
  readonly completedAt: IsoUtcTimestamp | null;
  readonly discardedAt: IsoUtcTimestamp | null;
  readonly createdAt: IsoUtcTimestamp;
  readonly updatedAt: IsoUtcTimestamp;
  readonly createdByAccountId: EntityId | null;
  readonly updatedByAccountId: EntityId | null;
  readonly localVersion: number;
  readonly serverVersion: number | null;
  readonly syncStatus: string;
  readonly lastSyncedAt: IsoUtcTimestamp | null;
  readonly deletedAt: IsoUtcTimestamp | null;
  readonly isDeleted: boolean;
};

export type VoiceTranscript = {
  readonly id: EntityId;
  readonly voiceCaptureSessionId: EntityId;
  readonly transcriptText: string;
  readonly languageCode: string | null;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly source: VoiceTranscriptSource;
  readonly status: VoiceTranscriptStatus;
  readonly isPartial: boolean;
  readonly isSynthetic: boolean;
  readonly createdAt: IsoUtcTimestamp;
  readonly confirmedAt: IsoUtcTimestamp | null;
  readonly createdByAccountId: EntityId | null;
  readonly updatedByAccountId: EntityId | null;
  readonly localVersion: number;
  readonly syncStatus: string;
};

export type VoiceExtractionRun = {
  readonly id: EntityId;
  readonly voiceCaptureSessionId: EntityId;
  readonly transcriptId: EntityId;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly extractionSchemaId: string;
  readonly extractionSchemaVersion: number;
  readonly status: VoiceExtractionRunStatus;
  readonly createdAt: IsoUtcTimestamp;
  readonly completedAt: IsoUtcTimestamp | null;
  readonly createdByAccountId: EntityId | null;
  readonly localVersion: number;
  readonly syncStatus: string;
};

export type VoiceExtractionSuggestion = {
  readonly id: EntityId;
  readonly extractionRunId: EntityId;
  readonly targetType: VoiceAllowedTargetType;
  readonly targetKey: string;
  readonly proposedValueJson: string;
  readonly confirmedValueJson: string | null;
  readonly valueType: VoiceSuggestionValueType;
  readonly sourceStart: number | null;
  readonly sourceEnd: number | null;
  readonly sourceTextHash: string | null;
  readonly confidenceCategory: VoiceConfidenceCategory;
  readonly reviewStatus: VoiceSuggestionReviewStatus;
  readonly reviewedByAccountId: EntityId | null;
  readonly reviewedAt: IsoUtcTimestamp | null;
  readonly rejectionReasonCode: VoiceRejectionReasonCode | null;
  readonly localVersion: number;
  readonly syncStatus: string;
};
