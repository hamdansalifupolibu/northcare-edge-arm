import { getAppConfig } from '../../../config/appConfig';
import { DEV_AUTH_BYPASS_ACCOUNT_ID } from '../../auth/development/devAuthBypass';
import {
  applySyntheticReachDemoMutation,
  getSyntheticReachDemoRequest,
  isDemoReachRequestId,
  listSyntheticReachDemoRequests,
  mergeReachListItems,
  solveSyntheticReachDemoRequest,
  takeSyntheticReachDemoRequest,
} from '../demo/reachDemoInbox';
import { CommunityRequestError } from '../domain/errors';
import type {
  CommunityRequestListFilter,
  WorkerMutationResponse,
} from '../domain/types';
import type { CommunityRequestServices } from './createCommunityRequestServices';

export function shouldUseReachDemoInbox(): boolean {
  return getAppConfig().appEnv === 'development';
}

function demoMutationResponse(detail: {
  readonly requestId: string;
  readonly status: string;
  readonly version: number;
}): WorkerMutationResponse {
  return {
    requestId: detail.requestId,
    status: detail.status,
    version: detail.version,
    assignedWorkerId: isDemoReachRequestId(detail.requestId) ? DEV_AUTH_BYPASS_ACCOUNT_ID : null,
    message: null,
  };
}

function mapDemoMutationError(error: unknown): never {
  if (error instanceof Error && error.message === 'communityRequestVersionConflict') {
    throw new CommunityRequestError('communityRequestVersionConflict');
  }
  if (error instanceof Error && error.message === 'communityRequestNotFound') {
    throw new CommunityRequestError('communityRequestNotFound');
  }
  throw error;
}

export function createDemoAwareCommunityRequestServices(
  base: CommunityRequestServices,
): CommunityRequestServices {
  if (!shouldUseReachDemoInbox()) {
    return base;
  }

  return {
    async listCommunityRequests(filter: CommunityRequestListFilter = 'awaiting', options) {
      try {
        const live = await base.listCommunityRequests(filter, options);
        return { items: mergeReachListItems(live.items, filter) };
      } catch {
        return { items: listSyntheticReachDemoRequests(filter) };
      }
    },

    async getCommunityRequest(requestId, options) {
      const demo = getSyntheticReachDemoRequest(requestId);
      if (demo) {
        return demo;
      }
      return base.getCommunityRequest(requestId, options);
    },

    async acknowledgeCommunityRequest(requestId, expectedVersion) {
      if (!isDemoReachRequestId(requestId)) {
        return base.acknowledgeCommunityRequest(requestId, expectedVersion);
      }
      try {
        const next = takeSyntheticReachDemoRequest(requestId, expectedVersion);
        return demoMutationResponse(next);
      } catch (error) {
        mapDemoMutationError(error);
      }
    },

    async recordCommunityContactAttempt(requestId, expectedVersion) {
      if (!isDemoReachRequestId(requestId)) {
        return base.recordCommunityContactAttempt(requestId, expectedVersion);
      }
      try {
        const next = applySyntheticReachDemoMutation(requestId, expectedVersion, {
          status: 'contactAttempted',
        });
        return demoMutationResponse(next);
      } catch (error) {
        mapDemoMutationError(error);
      }
    },

    async markCommunityRequestHandled(requestId, expectedVersion) {
      if (!isDemoReachRequestId(requestId)) {
        return base.markCommunityRequestHandled(requestId, expectedVersion);
      }
      try {
        const next = solveSyntheticReachDemoRequest(requestId, expectedVersion);
        return demoMutationResponse(next);
      } catch (error) {
        mapDemoMutationError(error);
      }
    },

    async escalateCommunityRequest(requestId, expectedVersion) {
      if (!isDemoReachRequestId(requestId)) {
        return base.escalateCommunityRequest(requestId, expectedVersion);
      }
      try {
        const next = applySyntheticReachDemoMutation(requestId, expectedVersion, {
          status: 'escalated',
        });
        return demoMutationResponse(next);
      } catch (error) {
        mapDemoMutationError(error);
      }
    },
  };
}
