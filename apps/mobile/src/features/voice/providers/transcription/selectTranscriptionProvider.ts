import { getAppConfig } from '../../../../config/appConfig';
import type { AppEnvironment } from '../../../../types/env';
import { isDagbanliTranscriptionLanguage } from '../../../../i18n/transcriptionLanguage';
import type { VoiceTranscriptionProvider } from '../../domain/providers';
import { createDevelopmentSimulationTranscriptionProvider } from './DevelopmentSimulationTranscriptionProvider';
import { createUnavailableTranscriptionProvider } from './UnavailableTranscriptionProvider';
import { createWhisperTranscriptionProvider } from './WhisperTranscriptionProvider';
import { WhisperModelManager } from './whisperModelManager';

/**
 * Selects transcription provider based on environment, model readiness, and language.
 * - English (`en`): offline Whisper when model is ready.
 * - Dagbanli (`dag`/`dg`): unavailable until on-device WAXAL Whisper is provisioned (Phase B).
 *   Manual transcript entry remains the offline path.
 *
 * GhanaNLP cloud ASR is intentionally not used at runtime (offline-first product rule).
 */
export function selectTranscriptionProvider(
  environment: AppEnvironment = getAppConfig().appEnv,
  languageHint: string | null = null,
): VoiceTranscriptionProvider {
  if (isDagbanliTranscriptionLanguage(languageHint)) {
    return createUnavailableTranscriptionProvider();
  }

  const manager = WhisperModelManager.getInstance();
  const snapshot = manager.getSnapshot();

  if (snapshot.state === 'ready') {
    return createWhisperTranscriptionProvider();
  }

  if (environment === 'production' || environment === 'staging') {
    return createUnavailableTranscriptionProvider();
  }
  return createDevelopmentSimulationTranscriptionProvider({ allowInProduction: false });
}

export function countApprovedProductionTranscriptionProviders(): number {
  const manager = WhisperModelManager.getInstance();
  return manager.getSnapshot().state === 'ready' ? 1 : 0;
}
