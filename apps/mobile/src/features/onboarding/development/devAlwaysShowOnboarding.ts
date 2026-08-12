import Constants from 'expo-constants';

import { getAppConfig } from '../../../config/appConfig';

/**
 * Development-only: show the full onboarding story after every cold start
 * (splash logo → onboarding → login entry), not only on first launch.
 *
 * Enabled by default in development + __DEV__ builds.
 * Opt out: EXPO_PUBLIC_DEV_ALWAYS_SHOW_ONBOARDING=false
 */
export function isDevAlwaysShowOnboardingEnabled(): boolean {
  if (getAppConfig().appEnv !== 'development') {
    return false;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__ === false) {
    return false;
  }

  const env = process.env.EXPO_PUBLIC_DEV_ALWAYS_SHOW_ONBOARDING;
  // Metro .env overrides native extra baked at prebuild (hackathon demo toggles without rebuild).
  if (env === 'true') {
    return true;
  }
  if (env === 'false') {
    return false;
  }

  const extra = Constants.expoConfig?.extra as
    | { readonly devAlwaysShowOnboarding?: unknown }
    | undefined;

  if (extra?.devAlwaysShowOnboarding === false) {
    return false;
  }

  return true;
}
