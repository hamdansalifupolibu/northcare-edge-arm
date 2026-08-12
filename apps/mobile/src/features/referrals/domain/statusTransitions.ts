import type { ReferralStatus } from '../../../data/domain/enums/domainEnums';
import { ReferralError } from './errors';

/**
 * Allowed referral status transitions (Stage 10).
 * Scan / resolve alone must never trigger these transitions.
 */
const ALLOWED: Readonly<Record<ReferralStatus, readonly ReferralStatus[]>> = {
  draft: ['created', 'cancelled'],
  created: ['caregiverInformed', 'journeyStarted', 'cancelled', 'overdue'],
  caregiverInformed: ['journeyStarted', 'facilityReached', 'cancelled', 'overdue'],
  journeyStarted: ['facilityReached', 'cancelled', 'overdue'],
  facilityReached: ['patientReceived', 'cancelled', 'overdue'],
  patientReceived: ['completed', 'cancelled'],
  overdue: [
    'caregiverInformed',
    'journeyStarted',
    'facilityReached',
    'patientReceived',
    'completed',
    'cancelled',
  ],
  completed: [],
  cancelled: [],
};

export function canTransitionReferralStatus(
  from: ReferralStatus,
  to: ReferralStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED[from].includes(to);
}

export function assertCanTransitionReferralStatus(
  from: ReferralStatus,
  to: ReferralStatus,
): void {
  if (!canTransitionReferralStatus(from, to)) {
    throw new ReferralError(
      'invalidTransition',
      'That referral status change is not allowed from the current status.',
    );
  }
}

export function listAllowedTransitions(
  from: ReferralStatus,
): readonly ReferralStatus[] {
  return ALLOWED[from];
}
