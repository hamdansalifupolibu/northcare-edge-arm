import { getAppConfig } from '../../../config/appConfig';
import type { PullChange, PushResult, SyncConflict, SyncOperation } from '../domain/protocol';

type FetchLike = typeof fetch;

export type SyncTransport = {
  registerDevice(deviceId: string): Promise<void>;
  push(deviceId: string, operations: readonly SyncOperation[]): Promise<readonly PushResult[]>;
  pull(cursor: string | null): Promise<{
    readonly changes: readonly PullChange[];
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  }>;
  listConflicts(): Promise<readonly SyncConflict[]>;
  resolveConflict(id: string, action: 'chooseServer' | 'keepForReview' | 'chooseLocal'): Promise<void>;
};

function apiUrl(path: string): string {
  const { apiBaseUrl, appEnv } = getAppConfig();
  if (!apiBaseUrl) throw new Error('Sync server is not configured for this build.');
  const url = new URL(path, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
  if (appEnv === 'production' && url.protocol !== 'https:') {
    throw new Error('Production sync requires an HTTPS API URL.');
  }
  return url.toString();
}

export type AccessTokenStore = { getAccessToken(): Promise<string | null> };

async function request<T>(
  fetcher: FetchLike,
  tokens: AccessTokenStore,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await tokens.getAccessToken();
  if (!token) throw new Error('Sync authentication is unavailable. Sign in online before synchronising.');
  const response = await fetcher(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Sync request failed (${response.status}).`);
  return (await response.json()) as T;
}

export function createSyncTransport(
  tokens: AccessTokenStore,
  fetcher: FetchLike = fetch,
): SyncTransport {
  return {
    async registerDevice(deviceId) {
      await request(fetcher, tokens, '/v1/devices/register', {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
      });
    },
    async push(deviceId, operations) {
      const result = await request<{ results: PushResult[] }>(fetcher, tokens, '/v1/sync/push', {
        method: 'POST',
        body: JSON.stringify({
          protocolVersion: 1,
          deviceId,
          operations: operations.map((operation) => ({
            operationId: operation.operationId,
            entityType: operation.entityType,
            entityId: operation.entityId,
            operation: operation.operation,
            baseServerVersion: operation.baseServerVersion,
            clientLocalVersion: operation.clientLocalVersion,
            payload: operation.payload ?? {},
            occurredAt: operation.occurredAt,
            requestHash: operation.requestHash,
          })),
        }),
      });
      return result.results;
    },
    async pull(cursor) {
      const query = new URLSearchParams({ limit: '100' });
      if (cursor) query.set('cursor', cursor);
      return request(fetcher, tokens, `/v1/sync/changes?${query.toString()}`);
    },
    async listConflicts() {
      const result = await request<{
        conflicts: {
          conflictId: string;
          entityType: string;
          entityId: string;
          conflictClass: string;
          status: SyncConflict['state'];
          serverVersion: number | null;
        }[];
      }>(fetcher, tokens, '/v1/sync/conflicts');
      return result.conflicts.map((conflict) => ({
        id: conflict.conflictId, entityType: conflict.entityType, entityId: conflict.entityId,
        conflictClass: conflict.conflictClass, state: conflict.status, serverVersion: conflict.serverVersion,
      }));
    },
    async resolveConflict(id, action) {
      await request(fetcher, tokens, `/v1/sync/conflicts/${encodeURIComponent(id)}/resolve`, {
        method: 'POST', body: JSON.stringify({ action }),
      });
    },
  };
}
