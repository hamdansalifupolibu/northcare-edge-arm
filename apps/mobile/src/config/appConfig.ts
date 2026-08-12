import { Platform } from 'react-native';

import { APP_METADATA } from '../constants/metadata';
import type { AppEnvironment } from '../types/env';
import { parsePublicEnv } from './env';

export type BuildType = 'development' | 'preview' | 'production';

export type AppConfig = {
  readonly productName: string;
  readonly tagline: string;
  readonly appVersion: string;
  readonly appEnv: AppEnvironment;
  readonly buildType: BuildType;
  readonly apiBaseUrl: string;
  readonly androidPackage: string;
  readonly androidPackageProvisional: boolean;
  readonly diagnosticsEnabled: boolean;
  readonly platform: typeof Platform.OS;
};

function resolveBuildType(appEnv: AppEnvironment): BuildType {
  if (appEnv === 'production') {
    return 'production';
  }
  if (appEnv === 'staging') {
    return 'preview';
  }
  return 'development';
}

/**
 * Typed development configuration.
 * Components must read configuration from here, not from process.env directly.
 */
export function createAppConfig(): AppConfig {
  const publicEnv = parsePublicEnv();
  const diagnosticsEnabled = publicEnv.appEnv !== 'production';

  return {
    productName: APP_METADATA.productName,
    tagline: APP_METADATA.tagline,
    appVersion: APP_METADATA.appVersion,
    appEnv: publicEnv.appEnv,
    buildType: resolveBuildType(publicEnv.appEnv),
    apiBaseUrl: publicEnv.apiBaseUrl,
    androidPackage: APP_METADATA.androidPackage,
    androidPackageProvisional: APP_METADATA.androidPackageStatus === 'provisional',
    diagnosticsEnabled,
    platform: Platform.OS,
  };
}

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedConfig === null) {
    cachedConfig = createAppConfig();
  }
  return cachedConfig;
}

/** Test helper — clears cached config. */
export function resetAppConfigCache(): void {
  cachedConfig = null;
}
