import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { ExtractionSchemaDefinition } from '../providers/extraction/schemas/types';
import type {
  VoiceAllowedTargetType,
  VoiceConfidenceCategory,
  VoiceSuggestionValueType,
} from './types';

export type ProviderAvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'developmentOnly'
  | 'requiresApproval'
  | 'failedClosed';

export type VoiceTranscriptionRequest = {
  readonly captureSessionId: EntityId;
  readonly audioUri: string;
  readonly mimeType: string | null;
  readonly durationMs: number | null;
  readonly languageHint: string | null;
  readonly providerConfigVersion: string;
};

export type VoiceTranscriptionResult = {
  readonly providerId: string;
  readonly providerVersion: string;
  readonly status: 'completed' | 'failed' | 'unavailable';
  readonly transcriptText: string | null;
  readonly detectedLanguage: string | null;
  readonly isPartial: boolean;
  readonly isSynthetic: boolean;
  readonly connectivityRequired: boolean;
  readonly errorCategory: string | null;
  readonly confidenceCategory: VoiceConfidenceCategory;
};

export type VoiceTranscriptionProvider = {
  readonly id: string;
  readonly version: string;
  readonly availability: ProviderAvailabilityStatus;
  readonly supportsOffline: boolean;
  readonly isSynthetic: boolean;
  transcribe(input: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResult>;
};

export type StructuredExtractionRequest = {
  readonly captureSessionId: EntityId;
  readonly transcriptId: EntityId;
  readonly confirmedTranscript: string;
  readonly schema: ExtractionSchemaDefinition;
  readonly clientCategory: string | null;
  readonly visitType: string | null;
  readonly screeningTemplateId: string | null;
  readonly screeningTemplateVersion: number | null;
  readonly languageCode: string | null;
  readonly providerConfigVersion: string;
};

export type StructuredExtractionSuggestionDraft = {
  readonly targetType: VoiceAllowedTargetType;
  readonly targetKey: string;
  readonly proposedValue: unknown;
  readonly valueType: VoiceSuggestionValueType;
  readonly sourceStart: number | null;
  readonly sourceEnd: number | null;
  readonly sourceTextExcerpt: string | null;
  readonly confidenceCategory: VoiceConfidenceCategory;
};

export type StructuredExtractionResult = {
  readonly providerId: string;
  readonly providerVersion: string;
  readonly status: 'completed' | 'failed' | 'unavailable';
  readonly suggestions: readonly StructuredExtractionSuggestionDraft[];
  readonly isSynthetic: boolean;
  readonly connectivityRequired: boolean;
  readonly errorCategory: string | null;
};

export type StructuredExtractionProvider = {
  readonly id: string;
  readonly version: string;
  readonly availability: ProviderAvailabilityStatus;
  readonly supportsOffline: boolean;
  readonly isSynthetic: boolean;
  extract(input: StructuredExtractionRequest): Promise<StructuredExtractionResult>;
};
