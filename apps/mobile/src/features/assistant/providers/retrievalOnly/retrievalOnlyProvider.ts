import type { AppEnvironment } from '../../../../types/env';
import {
  listLoadableKnowledgePacks,
} from '../../content/registry';
import type { AssistantMode } from '../../domain/modes';

export function resolveAssistantMode(environment: AppEnvironment): AssistantMode {
  const packs = listLoadableKnowledgePacks(environment);
  if (packs.length === 0) {
    return 'UNAVAILABLE';
  }
  if (environment === 'production') {
    return 'CURATED_RETRIEVAL';
  }
  // Development uses curated retrieval over synthetic packs (not generative).
  return 'CURATED_RETRIEVAL';
}

export function isDevelopmentSimulationAllowed(environment: AppEnvironment): boolean {
  return environment !== 'production';
}
