import NetInfo from '@react-native-community/netinfo';

import { getAppConfig } from '../../../config/appConfig';
import { createSecureAccessTokenStore } from '../../sync/application/accessTokenStore';
import type { AccessTokenStore } from '../../sync/transport/syncTransport';
import {
  AdministrationError,
  AdministrationOfflineError,
  parseAdministrationErrorCode,
  type AdministrationErrorCode,
} from '../domain/errors';
import type {
  AccountSearchQuery,
  AdminAccountDetails,
  AdminAccountListPage,
  AdminDevice,
  AdminFacility,
  AdminHistoryEvent,
  AdminHomeSummary,
  AdminSyncedRecordPage,
  MutationAck,
  ProfessionRegistryItem,
  ProfessionalProfile,
  ProfessionalProfileInput,
  RegisterWorkerInput,
  RegisterWorkerResult,
  SessionAuthorisation,
} from '../domain/types';

type FetchLike = typeof fetch;

function apiUrl(path: string): string {
  const { apiBaseUrl, appEnv } = getAppConfig();
  if (!apiBaseUrl) {
    throw new AdministrationError('backendUnavailable');
  }
  const url = new URL(path, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
  if (appEnv === 'production' && url.protocol !== 'https:') {
    throw new AdministrationError('backendUnavailable');
  }
  return url.toString();
}

async function assertOnline(): Promise<void> {
  const state = await NetInfo.fetch();
  if (!state.isConnected || state.isInternetReachable === false) {
    throw new AdministrationOfflineError();
  }
}

async function request<T>(
  fetcher: FetchLike,
  tokens: AccessTokenStore,
  path: string,
  init?: RequestInit & { readonly requireConnectivity?: boolean },
): Promise<T> {
  if (init?.requireConnectivity !== false) {
    await assertOnline();
  }
  const token = await tokens.getAccessToken();
  if (!token) {
    throw new AdministrationError('administratorAuthenticationRequired');
  }
  const response = await fetcher(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let code: AdministrationErrorCode = 'unknown';
    try {
      const body = (await response.json()) as { detail?: unknown };
      code = parseAdministrationErrorCode(body.detail);
    } catch {
      // ignore parse failures
    }
    throw new AdministrationError(code);
  }
  return (await response.json()) as T;
}

export type AdministrationApiClient = {
  getSessionAuthorisation(): Promise<SessionAuthorisation>;
  getAdminHome(): Promise<AdminHomeSummary>;
  listSyncedRecords(query?: {
    readonly facilityId?: string;
    readonly entityType?: string;
    readonly limit?: number;
  }): Promise<AdminSyncedRecordPage>;
  listFacilities(): Promise<readonly AdminFacility[]>;
  listProfessions(): Promise<readonly ProfessionRegistryItem[]>;
  listAccounts(query: AccountSearchQuery): Promise<AdminAccountListPage>;
  getAccountDetails(accountId: string): Promise<AdminAccountDetails>;
  registerWorker(input: RegisterWorkerInput): Promise<RegisterWorkerResult>;
  upsertProfessionalProfile(
    accountId: string,
    input: ProfessionalProfileInput,
  ): Promise<ProfessionalProfile>;
  assignWorkerFacility(
    accountId: string,
    facilityId: string,
    expectedAccountVersion: number,
  ): Promise<MutationAck>;
  deactivateWorker(accountId: string, expectedAccountVersion: number): Promise<MutationAck>;
  reactivateWorker(accountId: string, expectedAccountVersion: number): Promise<MutationAck>;
  initiateWorkerAccessReset(
    accountId: string,
    expectedAccountVersion: number,
    temporaryPassword: string,
  ): Promise<MutationAck>;
  listRegisteredDevices(accountId: string, currentDeviceId?: string): Promise<readonly AdminDevice[]>;
  revokeRegisteredDevice(accountId: string, deviceId: string): Promise<AdminDevice>;
  getAdministrationHistory(accountId: string): Promise<readonly AdminHistoryEvent[]>;
};

export function createAdministrationApiClient(
  tokens: AccessTokenStore = createSecureAccessTokenStore(),
  fetcher: FetchLike = fetch,
): AdministrationApiClient {
  return {
    async getSessionAuthorisation() {
      return request<SessionAuthorisation>(fetcher, tokens, '/v1/auth/session', {
        requireConnectivity: false,
      });
    },
    async getAdminHome() {
      return request<AdminHomeSummary>(fetcher, tokens, '/v1/admin/home');
    },
    async listSyncedRecords(query = {}) {
      const params = new URLSearchParams();
      if (query.facilityId) params.set('facilityId', query.facilityId);
      if (query.entityType) params.set('entityType', query.entityType);
      if (query.limit) params.set('limit', String(query.limit));
      const suffix = params.toString();
      return request<AdminSyncedRecordPage>(
        fetcher,
        tokens,
        `/v1/admin/synced-records${suffix ? `?${suffix}` : ''}`,
      );
    },
    async listFacilities() {
      const result = await request<{ items: AdminFacility[] }>(
        fetcher,
        tokens,
        '/v1/admin/facilities',
      );
      return result.items;
    },
    async listProfessions() {
      const result = await request<{ items: ProfessionRegistryItem[] }>(
        fetcher,
        tokens,
        '/v1/admin/professions',
      );
      return result.items;
    },
    async listAccounts(query) {
      const params = new URLSearchParams();
      params.set('page', String(query.page ?? 1));
      params.set('pageSize', String(query.pageSize ?? 20));
      if (query.search) params.set('search', query.search);
      if (query.facilityId) params.set('facilityId', query.facilityId);
      if (query.status) params.set('status', query.status);
      return request<AdminAccountListPage>(
        fetcher,
        tokens,
        `/v1/admin/accounts?${params.toString()}`,
      );
    },
    async getAccountDetails(accountId) {
      return request<AdminAccountDetails>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}`,
      );
    },
    async registerWorker(input) {
      return request<RegisterWorkerResult>(fetcher, tokens, '/v1/admin/accounts', {
        method: 'POST',
        body: JSON.stringify({
          displayName: input.displayName,
          email: input.email,
          facilityId: input.facilityId,
          temporaryPassword: input.temporaryPassword,
          idempotencyKey: input.idempotencyKey,
          profession: input.profession,
          otherProfessionDescription: input.otherProfessionDescription ?? null,
          communityRequestsEnabled: input.communityRequestsEnabled,
          emergencyRequestsEnabled: input.emergencyRequestsEnabled,
        }),
      });
    },
    async upsertProfessionalProfile(accountId, input) {
      return request<ProfessionalProfile>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/professional-profile`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            profession: input.profession,
            otherProfessionDescription: input.otherProfessionDescription ?? null,
            communityRequestsEnabled: input.communityRequestsEnabled,
            emergencyRequestsEnabled: input.emergencyRequestsEnabled,
            expectedProfileVersion: input.expectedProfileVersion ?? undefined,
          }),
        },
      );
    },
    async assignWorkerFacility(accountId, facilityId, expectedAccountVersion) {
      return request<MutationAck>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/facility`,
        {
          method: 'PATCH',
          body: JSON.stringify({ facilityId, expectedAccountVersion }),
        },
      );
    },
    async deactivateWorker(accountId, expectedAccountVersion) {
      return request<MutationAck>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/deactivate`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedAccountVersion }),
        },
      );
    },
    async reactivateWorker(accountId, expectedAccountVersion) {
      return request<MutationAck>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/reactivate`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedAccountVersion }),
        },
      );
    },
    async initiateWorkerAccessReset(accountId, expectedAccountVersion, temporaryPassword) {
      return request<MutationAck>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/reset-access`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedAccountVersion, temporaryPassword }),
        },
      );
    },
    async listRegisteredDevices(accountId, currentDeviceId) {
      const result = await request<{ items: AdminDevice[] }>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/devices`,
        {
          headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : undefined,
        },
      );
      return result.items;
    },
    async revokeRegisteredDevice(accountId, deviceId) {
      return request<AdminDevice>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/devices/${encodeURIComponent(deviceId)}/revoke`,
        { method: 'POST' },
      );
    },
    async getAdministrationHistory(accountId) {
      const result = await request<{ items: AdminHistoryEvent[] }>(
        fetcher,
        tokens,
        `/v1/admin/accounts/${encodeURIComponent(accountId)}/history`,
      );
      return result.items;
    },
  };
}
