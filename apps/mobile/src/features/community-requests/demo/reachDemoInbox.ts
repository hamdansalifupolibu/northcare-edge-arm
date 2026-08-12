import { DEV_AUTH_BYPASS_ACCOUNT_ID } from '../../auth/development/devAuthBypass';
import type {
  CommunityRequestListFilter,
  WorkerRequestDetail,
  WorkerRequestListItem,
} from '../domain/types';

export const DEMO_REACH_REQUEST_ID_PREFIX = 'demo-reach-';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Synthetic USSD submissions for hackathon walkthrough — not real patient data. */
export const SYNTHETIC_REACH_DEMO_CATALOG: readonly WorkerRequestDetail[] = [
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}001`,
    category: 'childHealth',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC-DEMO-001',
    communityOrLandmark: 'Tamale Aboabo — near CHPS compound',
    preferredLanguage: 'Dagbani',
    consentToContact: true,
    consentToShareLocation: true,
    status: 'received',
    assignedToCaller: false,
    assignedWorkerId: null,
    createdAt: minutesAgo(12),
    updatedAt: minutesAgo(12),
    version: 1,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}002`,
    category: 'pregnancyNewborn',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC-DEMO-002',
    communityOrLandmark: 'Sagnarigu — market area landmark',
    preferredLanguage: 'Dagbani',
    consentToContact: true,
    consentToShareLocation: false,
    status: 'received',
    assignedToCaller: false,
    assignedWorkerId: null,
    createdAt: minutesAgo(28),
    updatedAt: minutesAgo(28),
    version: 1,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}003`,
    category: 'nutrition',
    requestType: 'urgentContact',
    contactNumber: 'SYNTHETIC-DEMO-003',
    communityOrLandmark: 'Kumbungu — main road junction',
    preferredLanguage: 'Dagbani',
    consentToContact: true,
    consentToShareLocation: true,
    status: 'acknowledged',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
    createdAt: hoursAgo(1),
    updatedAt: minutesAgo(40),
    version: 2,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}004`,
    category: 'emergency',
    requestType: 'emergencyAssistance',
    contactNumber: 'SYNTHETIC-DEMO-004',
    communityOrLandmark: 'Yendi road — community water point',
    preferredLanguage: 'Dagbani',
    consentToContact: true,
    consentToShareLocation: true,
    status: 'received',
    assignedToCaller: false,
    assignedWorkerId: null,
    createdAt: minutesAgo(5),
    updatedAt: minutesAgo(5),
    version: 1,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}005`,
    category: 'referralFollowUp',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC-DEMO-005',
    communityOrLandmark: 'Tamale Teaching Hospital catchment',
    preferredLanguage: 'English',
    consentToContact: true,
    consentToShareLocation: false,
    status: 'contactAttempted',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(2),
    version: 3,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}006`,
    category: 'generalChps',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC-DEMO-006',
    communityOrLandmark: 'Tolon — village centre',
    preferredLanguage: 'Dagbani',
    consentToContact: true,
    consentToShareLocation: false,
    status: 'received',
    assignedToCaller: false,
    assignedWorkerId: null,
    createdAt: minutesAgo(45),
    updatedAt: minutesAgo(45),
    version: 1,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}007`,
    category: 'generalChps',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC-DEMO-007',
    communityOrLandmark: 'Demo CHPS catchment — Lagbalbi',
    preferredLanguage: 'English',
    consentToContact: true,
    consentToShareLocation: true,
    status: 'handled',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(6),
    version: 4,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
  {
    requestId: `${DEMO_REACH_REQUEST_ID_PREFIX}008`,
    category: 'childHealth',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC-DEMO-008',
    communityOrLandmark: 'Savelugu — lorry park area',
    preferredLanguage: 'Dagbani',
    consentToContact: true,
    consentToShareLocation: false,
    status: 'handled',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    version: 3,
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
  },
];

const ACTIVE_STATUSES = new Set([
  'received',
  'assigned',
  'acknowledged',
  'contactAttempted',
  'escalated',
]);

const demoMutations = new Map<string, WorkerRequestDetail>();

export function isDemoReachRequestId(requestId: string): boolean {
  return requestId.startsWith(DEMO_REACH_REQUEST_ID_PREFIX);
}

export function resetDemoReachInboxMutations(): void {
  demoMutations.clear();
}

function resolveDemoDetail(requestId: string): WorkerRequestDetail | null {
  if (demoMutations.has(requestId)) {
    return demoMutations.get(requestId) ?? null;
  }
  return SYNTHETIC_REACH_DEMO_CATALOG.find((item) => item.requestId === requestId) ?? null;
}

function toListItem(detail: WorkerRequestDetail): WorkerRequestListItem {
  return {
    requestId: detail.requestId,
    category: detail.category,
    requestType: detail.requestType,
    communityOrLandmark: detail.communityOrLandmark,
    preferredLanguage: detail.preferredLanguage,
    status: detail.status,
    assignedToCaller: detail.assignedToCaller,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    version: detail.version,
  };
}

function isAwaitingItem(detail: WorkerRequestDetail): boolean {
  if (!ACTIVE_STATUSES.has(detail.status)) {
    return false;
  }
  if (detail.assignedToCaller) {
    return true;
  }
  return detail.status === 'received' && detail.assignedWorkerId == null;
}

function isAssignedToMeItem(detail: WorkerRequestDetail): boolean {
  return detail.assignedToCaller && detail.status !== 'handled' && detail.status !== 'cancelled';
}

function isEmergencyItem(detail: WorkerRequestDetail): boolean {
  return detail.category === 'emergency' || detail.requestType === 'emergencyAssistance';
}

function isHandledItem(detail: WorkerRequestDetail): boolean {
  return detail.assignedToCaller && detail.status === 'handled';
}

export function listSyntheticReachDemoRequests(
  filter: CommunityRequestListFilter,
): readonly WorkerRequestListItem[] {
  const allDetails = SYNTHETIC_REACH_DEMO_CATALOG.map(
    (item) => resolveDemoDetail(item.requestId) ?? item,
  );

  const filtered = allDetails.filter((detail) => {
    switch (filter) {
      case 'awaiting':
        return isAwaitingItem(detail);
      case 'assignedToMe':
        return isAssignedToMeItem(detail);
      case 'emergency':
        return isEmergencyItem(detail) && detail.status !== 'handled' && detail.status !== 'cancelled';
      case 'handled':
        return isHandledItem(detail);
      default:
        return false;
    }
  });

  return filtered
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toListItem);
}

export function getSyntheticReachDemoRequest(requestId: string): WorkerRequestDetail | null {
  return resolveDemoDetail(requestId);
}

export function countSyntheticReachDemoStats(): {
  readonly awaiting: number;
  readonly assignedToMe: number;
  readonly emergency: number;
} {
  return {
    awaiting: listSyntheticReachDemoRequests('awaiting').length,
    assignedToMe: listSyntheticReachDemoRequests('assignedToMe').length,
    emergency: listSyntheticReachDemoRequests('emergency').length,
  };
}

export function applySyntheticReachDemoMutation(
  requestId: string,
  expectedVersion: number,
  patch: Pick<WorkerRequestDetail, 'status'> & Partial<WorkerRequestDetail>,
): WorkerRequestDetail {
  const current = resolveDemoDetail(requestId);
  if (!current) {
    throw new Error('communityRequestNotFound');
  }
  if (current.version !== expectedVersion) {
    throw new Error('communityRequestVersionConflict');
  }
  const next: WorkerRequestDetail = {
    ...current,
    ...patch,
    assignedToCaller: patch.assignedToCaller ?? true,
    assignedWorkerId: patch.assignedWorkerId ?? DEV_AUTH_BYPASS_ACCOUNT_ID,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };
  demoMutations.set(requestId, next);
  return next;
}

/** Take a demo request — assign to worker and keep it open. */
export function takeSyntheticReachDemoRequest(
  requestId: string,
  expectedVersion: number,
): WorkerRequestDetail {
  return applySyntheticReachDemoMutation(requestId, expectedVersion, {
    status: 'acknowledged',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
  });
}

/** Mark a demo request handled (presentation shortcut). */
export function solveSyntheticReachDemoRequest(
  requestId: string,
  expectedVersion: number,
): WorkerRequestDetail {
  return applySyntheticReachDemoMutation(requestId, expectedVersion, {
    status: 'handled',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
  });
}

/** Reopen a handled demo request for another walkthrough. */
export function reopenSyntheticReachDemoRequest(
  requestId: string,
  expectedVersion: number,
): WorkerRequestDetail {
  return applySyntheticReachDemoMutation(requestId, expectedVersion, {
    status: 'acknowledged',
    assignedToCaller: true,
    assignedWorkerId: DEV_AUTH_BYPASS_ACCOUNT_ID,
  });
}

export function mergeReachListItems(
  live: readonly WorkerRequestListItem[],
  filter: CommunityRequestListFilter,
): readonly WorkerRequestListItem[] {
  const demoItems = listSyntheticReachDemoRequests(filter);
  const liveIds = new Set(live.map((item) => item.requestId));
  const merged = [...live, ...demoItems.filter((item) => !liveIds.has(item.requestId))];
  return merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
