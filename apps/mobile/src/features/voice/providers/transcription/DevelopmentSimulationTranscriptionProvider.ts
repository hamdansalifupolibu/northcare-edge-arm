import type {
  VoiceTranscriptionProvider,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResult,
} from '../../domain/providers';
import { VoiceError } from '../../domain/errors';

export const DEV_TRANSCRIPTION_PROVIDER_ID = 'development.simulation.transcription.v1';

/**
 * Development-only synthetic transcript. Non-clinical. Never activate in production.
 */
export function createDevelopmentSimulationTranscriptionProvider(options?: {
  readonly allowInProduction?: boolean;
}): VoiceTranscriptionProvider {
  return {
    id: DEV_TRANSCRIPTION_PROVIDER_ID,
    version: '1',
    availability: 'developmentOnly',
    supportsOffline: true,
    isSynthetic: true,
    async transcribe(input: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResult> {
      if (options?.allowInProduction === true) {
        throw new VoiceError(
          'providerNotAllowed',
          'Development transcription must never run in production.',
        );
      }
      // Do not log URI or content. Synthetic non-clinical text only.
      void input.captureSessionId;
      return {
        providerId: DEV_TRANSCRIPTION_PROVIDER_ID,
        providerVersion: '1',
        status: 'completed',
        transcriptText:
          'SYNTHETIC DEVELOPMENT TRANSCRIPT ONLY. Caregiver described a routine visit. No clinical ASR. Not Dagbanli. Worker must review and may replace with a manual transcript.',
        detectedLanguage: 'en',
        isPartial: false,
        isSynthetic: true,
        connectivityRequired: false,
        errorCategory: null,
        confidenceCategory: 'uncertain',
      };
    },
  };
}
