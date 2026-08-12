import {
  CommunityRequestError,
  CommunityRequestOfflineError,
  CommunityRequestTimeoutError,
} from '../domain/errors';
import { createCommunityRequestsApiClient } from '../transport/communityRequestsApiClient';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
}));

jest.mock('../../../config/appConfig', () => ({
  getAppConfig: () => ({
    apiBaseUrl: 'http://127.0.0.1:8000',
    appEnv: 'development',
  }),
}));

const NetInfo = jest.requireMock('@react-native-community/netinfo').default;

describe('communityRequestsApiClient', () => {
  beforeEach(() => {
    NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  function tokens(token: string | null = 'test-token') {
    return {
      getAccessToken: jest.fn(async () => token),
    };
  }

  it('lists with exact filter query and omits contact numbers from list contract usage', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            requestId: 'r1',
            category: 'generalChps',
            requestType: 'routine',
            communityOrLandmark: 'Demo',
            preferredLanguage: 'en',
            status: 'assigned',
            assignedToCaller: true,
            createdAt: '2026-08-03T10:00:00.000Z',
            updatedAt: '2026-08-03T10:00:00.000Z',
            version: 1,
          },
        ],
      }),
    }));
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    const result = await client.listCommunityRequests('assignedToMe');
    expect(fetcher).toHaveBeenCalled();
    const url = String(fetcher.mock.calls[0][0]);
    expect(url).toContain('/v1/worker/community-requests?filter=assignedToMe');
    expect(result.items[0]).not.toHaveProperty('contactNumber');
  });

  it('posts mutations with expectedVersion including escalate', async () => {
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({ expectedVersion: 3 });
      const status = String(url).includes('/escalate')
        ? 'escalated'
        : String(url).includes('/handle')
          ? 'handled'
          : String(url).includes('/contact-attempt')
            ? 'contactAttempted'
            : 'acknowledged';
      return {
        ok: true,
        status: 200,
        json: async () => ({
          requestId: 'r1',
          status,
          version: 4,
          assignedWorkerId: 'w1',
          message: status === 'escalated' ? 'Escalated for further human support.' : undefined,
        }),
      };
    });
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    await client.acknowledgeCommunityRequest('r1', 3);
    await client.escalateCommunityRequest('r1', 3);
    await client.recordCommunityContactAttempt('r1', 3);
    await client.markCommunityRequestHandled('r1', 3);
    expect(fetcher).toHaveBeenCalledTimes(4);
    const escalateUrl = String(fetcher.mock.calls[1][0]);
    expect(escalateUrl).toContain('/v1/worker/community-requests/r1/escalate');
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({ expectedVersion: 3 });
  });

  it('denies offline escalate without claiming success', async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    const fetcher = jest.fn();
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    await expect(client.escalateCommunityRequest('r1', 1)).rejects.toBeInstanceOf(
      CommunityRequestOfflineError,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('maps escalate capability and invalid-transition errors', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { code: 'emergencyCapabilityRequired' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { code: 'invalidCommunityRequestTransition' } }),
      });
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    await expect(client.escalateCommunityRequest('r1', 2)).rejects.toMatchObject({
      code: 'emergencyCapabilityRequired',
    });
    await expect(client.escalateCommunityRequest('r1', 2)).rejects.toMatchObject({
      code: 'invalidCommunityRequestTransition',
    });
  });

  it('maps reach-disabled and already-assigned errors', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { code: 'reachDemoDisabled' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { code: 'communityRequestAlreadyAssigned' } }),
      });
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    await expect(client.listCommunityRequests()).rejects.toMatchObject({
      code: 'reachDemoDisabled',
    });
    await expect(client.acknowledgeCommunityRequest('r1', 1)).rejects.toBeInstanceOf(
      CommunityRequestError,
    );
    await expect(
      createCommunityRequestsApiClient(
        tokens(),
        jest.fn(async () => ({
          ok: false,
          status: 409,
          json: async () => ({ detail: { code: 'communityRequestAlreadyAssigned' } }),
        })) as unknown as typeof fetch,
      ).acknowledgeCommunityRequest('r1', 1),
    ).rejects.toMatchObject({
      code: 'communityRequestAlreadyAssigned',
    });
  });

  it('denies offline mutations', async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    const fetcher = jest.fn();
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    await expect(client.acknowledgeCommunityRequest('r1', 1)).rejects.toBeInstanceOf(
      CommunityRequestOfflineError,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('treats abort timeout as timeout error without success', async () => {
    const fetcher = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );
    const client = createCommunityRequestsApiClient(tokens(), fetcher as unknown as typeof fetch);
    await expect(
      client.getCommunityRequest('r1', { timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(CommunityRequestTimeoutError);
  });

  it('requires auth token', async () => {
    const client = createCommunityRequestsApiClient(
      tokens(null),
      jest.fn() as unknown as typeof fetch,
    );
    await expect(client.listCommunityRequests()).rejects.toMatchObject({
      code: 'workerAuthenticationRequired',
    });
  });
});

