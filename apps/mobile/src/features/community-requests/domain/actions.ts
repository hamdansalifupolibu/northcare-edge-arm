import type { WorkerRequestDetail } from './types';

/**
 * UI action availability mirrors R2 transition outcomes.
 * The server remains authoritative; these helpers only hide clearly impossible actions.
 * Escalate is allowed only from `acknowledged` (R2 frozen transitions).
 */
export type CommunityRequestActionId =
  | 'acknowledge'
  | 'escalate'
  | 'contactAttempt'
  | 'markHandled';

export function canAcknowledge(detail: WorkerRequestDetail): boolean {
  if (detail.status === 'handled' || detail.status === 'cancelled') {
    return false;
  }
  if (detail.assignedToCaller && detail.status === 'assigned') {
    return true;
  }
  // Eligible unassigned facility queue items (server validates profession match).
  if (!detail.assignedToCaller && detail.status === 'received' && !detail.assignedWorkerId) {
    return true;
  }
  return false;
}

/** R2: acknowledged → escalated. Not based on category alone. */
export function canEscalate(detail: WorkerRequestDetail): boolean {
  if (!detail.assignedToCaller) return false;
  return detail.status === 'acknowledged';
}

export function canRecordContactAttempt(detail: WorkerRequestDetail): boolean {
  if (!detail.assignedToCaller) return false;
  return detail.status === 'acknowledged' || detail.status === 'escalated';
}

export function canMarkHandled(detail: WorkerRequestDetail): boolean {
  if (!detail.assignedToCaller) return false;
  return detail.status === 'contactAttempted';
}

export function availableCommunityRequestActions(
  detail: WorkerRequestDetail,
): readonly CommunityRequestActionId[] {
  const actions: CommunityRequestActionId[] = [];
  if (canAcknowledge(detail)) actions.push('acknowledge');
  if (canEscalate(detail)) actions.push('escalate');
  if (canRecordContactAttempt(detail)) actions.push('contactAttempt');
  if (canMarkHandled(detail)) actions.push('markHandled');
  return actions;
}
