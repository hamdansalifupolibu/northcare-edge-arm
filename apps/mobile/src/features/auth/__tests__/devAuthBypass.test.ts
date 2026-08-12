import { resetAppConfigCache } from '../../../config/appConfig';
import {
  createDevBypassAccount,
  createDevBypassSessionEnvelope,
  DEV_AUTH_BYPASS_ACCOUNT_ID,
  isDevAuthBypassEnabled,
} from '../development/devAuthBypass';

describe('devAuthBypass', () => {
  const originalBypass = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS;
  const originalEnv = process.env.EXPO_PUBLIC_APP_ENV;

  afterEach(() => {
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = originalBypass;
    process.env.EXPO_PUBLIC_APP_ENV = originalEnv;
    resetAppConfigCache();
  });

  it('is disabled unless the development flag is set', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'false';
    resetAppConfigCache();
    expect(isDevAuthBypassEnabled()).toBe(false);

    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'true';
    resetAppConfigCache();
    expect(isDevAuthBypassEnabled()).toBe(true);
  });

  it('is disabled outside development appEnv even when the flag is true', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'true';
    resetAppConfigCache();
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it('builds a dual-role session shaped for Worker screens', () => {
    const session = createDevBypassSessionEnvelope('2026-08-04T00:00:00.000Z');
    const account = createDevBypassAccount('2026-08-04T00:00:00.000Z');

    expect(session.accountId).toBe(DEV_AUTH_BYPASS_ACCOUNT_ID);
    expect(session.facilityId).toBe('fac-dev-001');
    expect(session.organisationId).toBe('org-dev-001');
    expect(session.permittedWorkspaces).toEqual(['worker', 'administration']);
    expect(session.activeWorkspace).toBeNull();
    expect(account.availableRoles).toEqual(['worker', 'administrator']);
    expect(account.requiresPasswordChange).toBe(false);
  });
});
