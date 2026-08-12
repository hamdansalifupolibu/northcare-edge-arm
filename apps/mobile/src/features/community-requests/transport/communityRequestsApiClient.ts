import NetInfo from '@react-native-community/netinfo';

import { getAppConfig } from '../../../config/appConfig';
import { createSecureAccessTokenStore } from '../../sync/application/accessTokenStore';
import type { AccessTokenStore } from '../../sync/transport/syncTransport';
import {
  CommunityRequestError,
  CommunityRequestOfflineError,
  CommunityRequestTimeoutError,
  parseCommunityRequestErrorCode,
  type CommunityRequestErrorCode,
} from '../domain/errors';
import type {
  CommunityRequestListFilter,
  WorkerMutationResponse,
  WorkerRequestDetail,
  WorkerRequestListResponse,
} from '../domain/types';

type FetchLike = typeof fetch;

const DEFAULT_TIMEOUT_MS = 30_000;

function apiUrl(path: string): string {
  const { apiBaseUrl, appEnv } = getAppConfig();
  if (!apiBaseUrl) {
    throw new CommunityRequestError('backendUnavailable');
  }
  const url = new URL(path, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
  if (appEnv === 'production' && url.protocol !== 'https:') {
    throw new CommunityRequestError('backendUnavailable');
  }
  return url.toString();
}

async function assertOnline(): Promise<void> {
  const state = await NetInfo.fetch();
  if (!state.isConnected || state.isInternetReachable === false) {
    throw new CommunityRequestOfflineError();
  }
}

type RequestOptions = RequestInit & {
  readonly requireConnectivity?: boolean;
  readonly timeoutMs?: number;
};

async function request<T>(
  fetcher: FetchLike,
  tokens: AccessTokenStore,
  path: string,
  init?: RequestOptions,
): Promise<T> {
  if (init?.requireConnectivity !== false) {
    await assertOnline();
  }
  const token = await tokens.getAccessToken();
  if (!token) {
    throw new CommunityRequestError('workerAuthenticationRequired');
  }

  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const externalSignal = init?.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  try {
    const response = await fetcher(apiUrl(path), {
      method: init?.method,
      body: init?.body,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
    if (!response.ok) {
      let code: CommunityRequestErrorCode = 'unknown';
      try {
        const body = (await response.json()) as { detail?: unknown };
        code = parseCommunityRequestErrorCode(body.detail);
      } catch {
        // ignore parse failures
      }
      throw new CommunityRequestError(code);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof CommunityRequestError) {
      throw error;
    }
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        error.name === 'AbortError');
    if (aborted) {
      if (timedOut) {
        throw new CommunityRequestTimeoutError();
      }
      throw new CommunityRequestError('unknown', 'request-cancelled');
    }
    throw new CommunityRequestError('backendUnavailable');
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export type CommunityRequestRequestOptions = {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

export type CommunityRequestsApiClient = {
  listCommunityRequests(
    filter?: CommunityRequestListFilter,
    options?: CommunityRequestRequestOptions,
  ): Promise<WorkerRequestListResponse>;
  getCommunityRequest(
    requestId: string,
    options?: CommunityRequestRequestOptions,
  ): Promise<WorkerRequestDetail>;
  acknowledgeCommunityRequest(
    requestId: string,
    expectedVersion: number,
  ): Promise<WorkerMutationResponse>;
  recordCommunityContactAttempt(
    requestId: string,
    expectedVersion: number,
  ): Promise<WorkerMutationResponse>;
  markCommunityRequestHandled(
    requestId: string,
    expectedVersion: number,
  ): Promise<WorkerMutationResponse>;
  escalateCommunityRequest(
    requestId: string,
    expectedVersion: number,
  ): Promise<WorkerMutationResponse>;
};

export function createCommunityRequestsApiClient(
  tokens: AccessTokenStore = createSecureAccessTokenStore(),
  fetcher: FetchLike = fetch,
): CommunityRequestsApiClient {
  return {
    async listCommunityRequests(filter = 'awaiting', options) {
      const params = new URLSearchParams();
      params.set('filter', filter);
      return request<WorkerRequestListResponse>(
        fetcher,
        tokens,
        `/v1/worker/community-requests?${params.toString()}`,
        { signal: options?.signal, timeoutMs: options?.timeoutMs },
      );
    },
    async getCommunityRequest(requestId, options) {
      return request<WorkerRequestDetail>(
        fetcher,
        tokens,
        `/v1/worker/community-requests/${encodeURIComponent(requestId)}`,
        { signal: options?.signal, timeoutMs: options?.timeoutMs },
      );
    },
    async acknowledgeCommunityRequest(requestId, expectedVersion) {
      return request<WorkerMutationResponse>(
        fetcher,
        tokens,
        `/v1/worker/community-requests/${encodeURIComponent(requestId)}/acknowledge`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        },
      );
    },
    async recordCommunityContactAttempt(requestId, expectedVersion) {
      return request<WorkerMutationResponse>(
        fetcher,
        tokens,
        `/v1/worker/community-requests/${encodeURIComponent(requestId)}/contact-attempt`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        },
      );
    },
    async markCommunityRequestHandled(requestId, expectedVersion) {
      return request<WorkerMutationResponse>(
        fetcher,
        tokens,
        `/v1/worker/community-requests/${encodeURIComponent(requestId)}/handle`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        },
      );
    },
    async escalateCommunityRequest(requestId, expectedVersion) {
      return request<WorkerMutationResponse>(
        fetcher,
        tokens,
        `/v1/worker/community-requests/${encodeURIComponent(requestId)}/escalate`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        },
      );
    },
  };
}
