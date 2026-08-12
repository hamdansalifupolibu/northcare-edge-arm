import type { AppEnvironment, PublicEnv } from '../types/env';

const ALLOWED_ENVIRONMENTS: readonly AppEnvironment[] = [
  'development',
  'staging',
  'production',
] as const;

function isAppEnvironment(value: string): value is AppEnvironment {
  return (ALLOWED_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * Parse and validate public Expo environment variables.
 * Fails clearly when an essential public value is malformed.
 */
export function parsePublicEnv(
  raw: Readonly<Record<string, string | undefined>> = {
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_GHANANLP_API_KEY: process.env.EXPO_PUBLIC_GHANANLP_API_KEY,
    EXPO_PUBLIC_GHANANLP_ASR_URL: process.env.EXPO_PUBLIC_GHANANLP_ASR_URL,
  },
): PublicEnv {
  const rawEnv = (raw.EXPO_PUBLIC_APP_ENV ?? 'development').trim().toLowerCase();

  if (!isAppEnvironment(rawEnv)) {
    throw new Error(
      `Invalid EXPO_PUBLIC_APP_ENV "${raw.EXPO_PUBLIC_APP_ENV ?? ''}". ` +
        `Expected one of: ${ALLOWED_ENVIRONMENTS.join(', ')}.`,
    );
  }

  const apiBaseUrl = (raw.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

  if (apiBaseUrl.length > 0) {
    let parsed: URL;
    try {
      parsed = new URL(apiBaseUrl);
    } catch {
      throw new Error(
        'Invalid EXPO_PUBLIC_API_BASE_URL. Provide a valid absolute URL or leave empty.',
      );
    }
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('API base URL must use http or https.');
    }
    if (rawEnv === 'production' && parsed.protocol !== 'https:') {
      throw new Error('Production API base URL must use HTTPS.');
    }
    if (rawEnv !== 'development' && parsed.protocol === 'http:') {
      throw new Error('Cleartext HTTP API URLs are only allowed in development.');
    }
  }

  return {
    appEnv: rawEnv,
    apiBaseUrl,
    ghananlpApiKey: (raw.EXPO_PUBLIC_GHANANLP_API_KEY ?? '').trim(),
    ghananlpAsrUrl: (
      raw.EXPO_PUBLIC_GHANANLP_ASR_URL ?? 'https://translation-api.ghananlp.org/asr/v1/transcribe'
    ).trim(),
  };
}
