jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

import { getAppConfig, resetAppConfigCache } from '../../../config/appConfig';
import { createAdministrationApiClient } from '../transport/administrationApiClient';

describe('administrationApiClient synced records', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://example.com/api';
    resetAppConfigCache();
  });

  it('requests synced records from the admin API', async () => {
    expect(getAppConfig().apiBaseUrl).toBe('https://example.com/api');

    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            facilityId: 'fac-dev-001',
            facilityName: 'Demo CHPS Compound',
            entityType: 'client',
            entityId: 'client-demo-001',
            serverVersion: 1,
            payload: { givenName: 'Amina', familyName: 'Demo' },
            updatedAt: '2026-08-09T12:00:00.000Z',
            syncedByAccountId: 'dev-dual-8d2ce4bbb8e656c8afea',
          },
        ],
        total: 1,
        organisationId: 'org-dev-001',
      }),
    })) as unknown as typeof fetch;

    const tokens = {
      getAccessToken: async () => 'demo-token',
    };

    const client = createAdministrationApiClient(tokens, fetcher);
    const page = await client.listSyncedRecords({ limit: 25 });

    expect(page.total).toBe(1);
    expect(page.items[0]?.entityId).toBe('client-demo-001');
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/v1/admin/synced-records?limit=25'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    );
  });
});
