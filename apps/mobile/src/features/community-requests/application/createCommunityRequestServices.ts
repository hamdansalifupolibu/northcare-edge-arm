import type {
  CommunityRequestRequestOptions,
  CommunityRequestsApiClient,
} from '../transport/communityRequestsApiClient';
import type {
  CommunityRequestListFilter,
  WorkerMutationResponse,
  WorkerRequestDetail,
  WorkerRequestListResponse,
} from '../domain/types';

export type CommunityRequestServices = {
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

export function createCommunityRequestServices(
  client: CommunityRequestsApiClient,
): CommunityRequestServices {
  return {
    listCommunityRequests: (filter, options) => client.listCommunityRequests(filter, options),
    getCommunityRequest: (requestId, options) => client.getCommunityRequest(requestId, options),
    acknowledgeCommunityRequest: (requestId, expectedVersion) =>
      client.acknowledgeCommunityRequest(requestId, expectedVersion),
    recordCommunityContactAttempt: (requestId, expectedVersion) =>
      client.recordCommunityContactAttempt(requestId, expectedVersion),
    markCommunityRequestHandled: (requestId, expectedVersion) =>
      client.markCommunityRequestHandled(requestId, expectedVersion),
    escalateCommunityRequest: (requestId, expectedVersion) =>
      client.escalateCommunityRequest(requestId, expectedVersion),
  };
}
