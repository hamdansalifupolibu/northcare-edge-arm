import Constants from 'expo-constants';

import { getAppConfig } from '../../config/appConfig';

/**
 * Seeds synthetic demo clients/referrals/reminders once per install in development demo builds.
 * Default on; set EXPO_PUBLIC_DEMO_AUTO_SEED=false to skip.
 */
export function isDemoAutoSeedEnabled(): boolean {
  if (getAppConfig().appEnv === 'production') {
    return false;
  }
  const extra = Constants.expoConfig?.extra as
    | { readonly demoAutoSeed?: unknown }
    | undefined;
  return extra?.demoAutoSeed !== false;
}

export const DEMO_SEED_AUDIT_EVENT = 'hackathon_demo_seed_completed';
