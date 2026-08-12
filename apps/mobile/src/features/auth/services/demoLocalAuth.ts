import { getAppConfig } from '../../../config/appConfig';

/**
 * Demo / hackathon local sign-in (synthetic accounts embedded in the app).
 *
 * Enabled when:
 * - EXPO_PUBLIC_APP_ENV=development (default for Metro + demo APKs), or
 * - EXPO_PUBLIC_DEMO_LOCAL_AUTH=true (explicit opt-in for a sideload release APK)
 *
 * Disable with EXPO_PUBLIC_DEMO_LOCAL_AUTH=false even in development.
 * Never enable for true production Firebase-backed releases without a security review.
 */
export function isDemoLocalAuthEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO_LOCAL_AUTH === 'false') {
    return false;
  }
  if (process.env.EXPO_PUBLIC_DEMO_LOCAL_AUTH === 'true') {
    return true;
  }
  return getAppConfig().appEnv === 'development';
}
