/** Typed contracts for R2 Worker Community Request APIs (OpenAPI camelCase). */

export type CommunityRequestListFilter =
  | 'awaiting'
  | 'assignedToMe'
  | 'emergency'
  | 'handled';

export type CommunityRequestStatus =
  | 'received'
  | 'assigned'
  | 'acknowledged'
  | 'contactAttempted'
  | 'escalated'
  | 'handled'
  | 'cancelled';

export type CommunityRequestCategory =
  | 'pregnancyNewborn'
  | 'childHealth'
  | 'nutrition'
  | 'generalChps'
  | 'referralFollowUp'
  | 'emergency';

export type CommunityRequestType = 'routine' | 'urgentContact' | 'emergencyAssistance';

export type WorkerRequestListItem = {
  readonly requestId: string;
  readonly category: string;
  readonly requestType: string;
  readonly communityOrLandmark: string;
  readonly preferredLanguage: string;
  readonly status: string;
  readonly assignedToCaller: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
};

export type WorkerRequestListResponse = {
  readonly items: readonly WorkerRequestListItem[];
};

export type WorkerRequestDetail = {
  readonly requestId: string;
  readonly category: string;
  readonly requestType: string;
  readonly contactNumber: string;
  readonly communityOrLandmark: string;
  readonly preferredLanguage: string;
  readonly consentToContact: boolean;
  readonly consentToShareLocation: boolean;
  readonly status: string;
  readonly assignedToCaller: boolean;
  readonly assignedWorkerId?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
  readonly handledMeans?: string;
};

export type WorkerMutationResponse = {
  readonly requestId: string;
  readonly status: string;
  readonly version: number;
  readonly assignedWorkerId?: string | null;
  readonly message?: string | null;
};

export type WorkerVersionMutationRequest = {
  readonly expectedVersion: number;
};
