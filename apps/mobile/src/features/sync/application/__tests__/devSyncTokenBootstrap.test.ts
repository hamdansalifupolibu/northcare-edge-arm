import { resetAppConfigCache } from '../../../../config/appConfig';
import { bootstrapDevBypassSyncToken } from '../devSyncTokenBootstrap';

describe('bootstrapDevBypassSyncToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetAppConfigCache();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns false when dev bypass is disabled', async () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'false';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://example.com/api';
    process.env.EXPO_PUBLIC_DEV_SYNC_DEMO_PASSWORD = 'NorthCareDemo1!';
    resetAppConfigCache();

    await expect(bootstrapDevBypassSyncToken()).resolves.toBe(false);
  });

  it('returns false when demo sync password is unset', async () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS = 'true';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://example.com/api';
    delete process.env.EXPO_PUBLIC_DEV_SYNC_DEMO_PASSWORD;
    resetAppConfigCache();

    await expect(bootstrapDevBypassSyncToken()).resolves.toBe(false);
  });
});
