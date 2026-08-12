export const ASSISTANT_MODES = [
  'CURATED_RETRIEVAL',
  'CONSTRAINED_GENERATION',
  'DEVELOPMENT_SIMULATION',
  'UNAVAILABLE',
] as const;

export type AssistantMode = (typeof ASSISTANT_MODES)[number];

export const RETRIEVAL_ENGINE_VERSION = 1 as const;
export const RESPONSE_COMPOSER_VERSION = 1 as const;
export const SEARCH_INDEX_VERSION = 1 as const;
export const ASSISTANT_PROVIDER_POLICY_VERSION = 1 as const;
