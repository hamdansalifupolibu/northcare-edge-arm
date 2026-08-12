import { getAppConfig } from '../../../config/appConfig';
import {
  DEV_AUTH_BYPASS_EMAIL,
  isDevAuthBypassEnabled,
} from '../../auth/development/devAuthBypass';
import {
  createSecureAccessTokenStore,
  requestDevelopmentAccessToken,
} from './accessTokenStore';

function readDevSyncDemoPassword(): string | null {
  const password = process.env.EXPO_PUBLIC_DEV_SYNC_DEMO_PASSWORD?.trim();
  return password && password.length > 0 ? password : null;
}

/**
 * Best-effort sync token for development auth bypass.
 * Does not block startup when the sync server is down or password is unset.
 */
export async function bootstrapDevBypassSyncToken(): Promise<boolean> {
  if (!isDevAuthBypassEnabled()) {
    return false;
  }
  const config = getAppConfig();
  if (!config.apiBaseUrl) {
    return false;
  }
  const password = readDevSyncDemoPassword();
  if (!password) {
    return false;
  }
  try {
    const token = await requestDevelopmentAccessToken({
      email: DEV_AUTH_BYPASS_EMAIL,
      password,
    });
    await createSecureAccessTokenStore().saveAccessToken(token.accessToken);
    return true;
  } catch {
    return false;
  }
}
