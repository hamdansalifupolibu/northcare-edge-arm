import { getAppConfig } from '../../../../config/appConfig';
import type { AppEnvironment } from '../../../../types/env';
import type { StructuredExtractionProvider } from '../../domain/providers';
import { createDevelopmentSimulationExtractionProvider } from './DevelopmentSimulationExtractionProvider';
import { createUnavailableExtractionProvider } from './UnavailableExtractionProvider';
import { createQwenExtractionProvider } from './QwenExtractionProvider';
import { getOfflineAiServices } from '../../../offline-ai/services/createOfflineAiServices';

export function selectExtractionProvider(
  environment: AppEnvironment = getAppConfig().appEnv,
): StructuredExtractionProvider {
  const ai = getOfflineAiServices();
  const snapshot = ai.getSnapshot();

  if (snapshot.model.exists) {
    return createQwenExtractionProvider();
  }

  if (environment === 'development' && snapshot.runtime.supported) {
    return createQwenExtractionProvider();
  }

  if (environment === 'production' || environment === 'staging') {
    return createUnavailableExtractionProvider();
  }
  return createDevelopmentSimulationExtractionProvider({ allowInProduction: false });
}

export function countApprovedProductionExtractionProviders(): number {
  const ai = getOfflineAiServices();
  return ai.getSnapshot().model.exists ? 1 : 0;
}
