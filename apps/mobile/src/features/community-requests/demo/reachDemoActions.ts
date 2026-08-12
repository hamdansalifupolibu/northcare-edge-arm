import type { WorkerRequestDetail, WorkerRequestListItem } from '../domain/types';
import { isDemoReachRequestId } from './reachDemoInbox';

type DemoRequest = Pick<WorkerRequestListItem, 'requestId' | 'status' | 'assignedToCaller'>;

/** Demo-only: take ownership and keep the request open for follow-up. */
export function canDemoTakeRequest(item: DemoRequest): boolean {
  if (!isDemoReachRequestId(item.requestId)) {
    return false;
  }
  if (item.status === 'handled' || item.status === 'cancelled') {
    return false;
  }
  if (item.status === 'received' && !item.assignedToCaller) {
    return true;
  }
  return item.assignedToCaller && item.status === 'assigned';
}

/** Demo-only: mark the community request handled (solved for this workflow). */
export function canDemoMarkSolved(item: DemoRequest): boolean {
  if (!isDemoReachRequestId(item.requestId)) {
    return false;
  }
  return item.status !== 'handled' && item.status !== 'cancelled';
}

/** Demo-only: reopen a handled request for another walkthrough. */
export function canDemoReopen(item: DemoRequest): boolean {
  return isDemoReachRequestId(item.requestId) && item.status === 'handled';
}

export function canDemoQuickActions(item: DemoRequest): boolean {
  return (
    canDemoTakeRequest(item) || canDemoMarkSolved(item) || canDemoReopen(item)
  );
}

export function canDemoDetailMarkSolved(detail: WorkerRequestDetail): boolean {
  if (!isDemoReachRequestId(detail.requestId)) {
    return false;
  }
  return detail.status !== 'handled' && detail.status !== 'cancelled';
}

export function canDemoDetailTake(detail: WorkerRequestDetail): boolean {
  return canDemoTakeRequest(detail);
}

export function canDemoDetailReopen(detail: WorkerRequestDetail): boolean {
  return canDemoReopen(detail);
}
