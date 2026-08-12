import type {
  VoiceTranscriptionProvider,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResult,
} from '../../domain/providers';

export const UNAVAILABLE_TRANSCRIPTION_PROVIDER_ID = 'production.unavailable.transcription.v1';

export function createUnavailableTranscriptionProvider(): VoiceTranscriptionProvider {
  return {
    id: UNAVAILABLE_TRANSCRIPTION_PROVIDER_ID,
    version: '1',
    availability: 'failedClosed',
    supportsOffline: false,
    isSynthetic: false,
    async transcribe(_input: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResult> {
      return {
        providerId: UNAVAILABLE_TRANSCRIPTION_PROVIDER_ID,
        providerVersion: '1',
        status: 'unavailable',
        transcriptText: null,
        detectedLanguage: null,
        isPartial: false,
        isSynthetic: false,
        connectivityRequired: false,
        errorCategory: 'noApprovedProvider',
        confidenceCategory: 'unknown',
      };
    },
  };
}
