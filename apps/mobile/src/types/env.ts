/**
 * Public environment values only.
 * Never place private secrets in EXPO_PUBLIC_* variables.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

export type PublicEnv = {
  readonly appEnv: AppEnvironment;
  readonly apiBaseUrl: string;
  readonly ghananlpApiKey: string;
  readonly ghananlpAsrUrl: string;
};
