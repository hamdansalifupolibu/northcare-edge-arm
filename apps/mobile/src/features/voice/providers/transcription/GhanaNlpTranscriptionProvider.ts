import { File } from 'expo-file-system';

import { getGhanaNlpConfig } from '../../../../config/ghanaNlpConfig';
import type {
  VoiceTranscriptionProvider,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResult,
} from '../../domain/providers';
import { isDagbanliTranscriptionLanguage } from '../../../../i18n/transcriptionLanguage';

/**
 * GhanaNLP online ASR provider — reference implementation only.
 * Not wired at runtime (offline-first product rule). See selectTranscriptionProvider.ts.
 * Future offline Dagbanli ASR: whisper-tiny-waxal-dag via whisper.rn (Phase B).
 */

export const GHANANLP_TRANSCRIPTION_PROVIDER_ID = 'online.ghananlp.transcription.v1';

const DEFAULT_ASR_URL = 'https://translation-api.ghananlp.org/asr/v1/transcribe';

type GhanaNlpAsrResponse = {
  readonly transcribedText?: string;
  readonly text?: string;
  readonly message?: string;
};

/**
 * Online Dagbanli transcription via GhanaNLP ASR API.
 * Requires EXPO_PUBLIC_GHANANLP_API_KEY and network connectivity.
 * Falls back to manual transcript entry when unavailable.
 */
export function createGhanaNlpTranscriptionProvider(): VoiceTranscriptionProvider {
  return {
    id: GHANANLP_TRANSCRIPTION_PROVIDER_ID,
    version: '1',
    availability: 'available',
    supportsOffline: false,
    isSynthetic: false,
    async transcribe(input: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResult> {
      const config = getGhanaNlpConfig();

      if (!isDagbanliTranscriptionLanguage(input.languageHint)) {
        return unavailableResult('unsupportedLanguage');
      }

      if (!config.apiKey) {
        return unavailableResult('ghananlpNotConfigured');
      }

      try {
        let audioPath = input.audioUri;
        if (audioPath.startsWith('file://')) {
          audioPath = audioPath.substring(7);
        }

        const file = new File(audioPath);
        const audioBase64 = await file.base64();

        const response = await fetch(config.asrUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': config.apiKey,
          },
          body: JSON.stringify({
            language: input.languageHint === 'dg' ? 'dag' : input.languageHint ?? 'dag',
            audio: audioBase64,
          }),
        });

        if (!response.ok) {
          return unavailableResult(`ghananlpHttp${response.status}`);
        }

        const payload = (await response.json()) as GhanaNlpAsrResponse;
        const transcriptText = (payload.transcribedText ?? payload.text ?? '').trim();

        if (!transcriptText) {
          return unavailableResult('ghananlpEmptyResponse');
        }

        return {
          providerId: GHANANLP_TRANSCRIPTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'completed',
          transcriptText,
          detectedLanguage: 'dag',
          isPartial: false,
          isSynthetic: false,
          connectivityRequired: true,
          errorCategory: null,
          confidenceCategory: 'medium',
        };
      } catch (err) {
        return unavailableResult(err instanceof Error ? err.message : 'ghananlpFailed');
      }
    },
  };
}

function unavailableResult(errorCategory: string): VoiceTranscriptionResult {
  return {
    providerId: GHANANLP_TRANSCRIPTION_PROVIDER_ID,
    providerVersion: '1',
    status: 'unavailable',
    transcriptText: null,
    detectedLanguage: null,
    isPartial: false,
    isSynthetic: false,
    connectivityRequired: true,
    errorCategory,
    confidenceCategory: 'uncertain',
  };
}
