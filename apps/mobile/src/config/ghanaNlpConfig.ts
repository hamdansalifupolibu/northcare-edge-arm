import { parsePublicEnv } from './env';

export type GhanaNlpConfig = {
  readonly apiKey: string;
  readonly asrUrl: string;
};

let cached: GhanaNlpConfig | null = null;

/**
 * GhanaNLP public configuration (API key is optional — Dagbanli ASR disabled without it).
 */
export function getGhanaNlpConfig(): GhanaNlpConfig {
  if (cached) {
    return cached;
  }

  const env = parsePublicEnv();
  cached = {
    apiKey: env.ghananlpApiKey,
    asrUrl: env.ghananlpAsrUrl,
  };
  return cached;
}

export function resetGhanaNlpConfigCache(): void {
  cached = null;
}
