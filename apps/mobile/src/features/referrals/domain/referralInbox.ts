import type { Referral } from '../../../data/domain/entities/entities';
import type { ReferralStatus } from '../../../data/domain/enums/domainEnums';

const TERMINAL: ReadonlySet<ReferralStatus> = new Set(['completed', 'cancelled']);

/** Open means the referral still needs worker / journey attention. */
export function isOpenReferralStatus(status: ReferralStatus): boolean {
  return !TERMINAL.has(status);
}

const EDITABLE: ReadonlySet<ReferralStatus> = new Set([
  'created',
  'caregiverInformed',
  'journeyStarted',
  'facilityReached',
  'patientReceived',
  'overdue',
]);

export function isReferralEditable(status: ReferralStatus): boolean {
  return EDITABLE.has(status);
}

/**
 * Recommended next forward status for the closed-loop demo/journey.
 * Does not include cancel/overdue (those stay on the update-status screen).
 */
export function recommendedNextReferralStatus(
  status: ReferralStatus,
): ReferralStatus | null {
  switch (status) {
    case 'draft':
      return 'created';
    case 'created':
      return 'caregiverInformed';
    case 'caregiverInformed':
      return 'journeyStarted';
    case 'journeyStarted':
      return 'facilityReached';
    case 'facilityReached':
      return 'patientReceived';
    case 'patientReceived':
      return 'completed';
    case 'overdue':
      return 'journeyStarted';
    case 'completed':
    case 'cancelled':
      return null;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type ReferralNextAction = {
  readonly targetStatus: ReferralStatus;
  readonly label: string;
  readonly hint: string;
};

export function getReferralNextAction(
  status: ReferralStatus,
): ReferralNextAction | null {
  const target = recommendedNextReferralStatus(status);
  if (!target) {
    return null;
  }

  switch (target) {
    case 'created':
      return {
        targetStatus: target,
        label: 'Confirm referral created',
        hint: 'Save this referral as ready for the caregiver journey.',
      };
    case 'caregiverInformed':
      return {
        targetStatus: target,
        label: 'Mark caregiver informed',
        hint: 'Confirm the caregiver understands where to go and can show the passport.',
      };
    case 'journeyStarted':
      return {
        targetStatus: target,
        label: 'Mark journey started',
        hint: 'Record that travel to the receiving facility has begun.',
      };
    case 'facilityReached':
      return {
        targetStatus: target,
        label: 'Mark facility reached',
        hint: 'Record that the person has arrived at the receiving facility.',
      };
    case 'patientReceived':
      return {
        targetStatus: target,
        label: 'Mark client received',
        hint: 'Record that the receiving facility has taken the person into care.',
      };
    case 'completed':
      return {
        targetStatus: target,
        label: 'Mark completed',
        hint: 'Close this referral after attention has been provided.',
      };
    default:
      return {
        targetStatus: target,
        label: 'Update status',
        hint: 'Continue the referral journey.',
      };
  }
}

/** Sort open/overdue first, then by newest createdAt. */
export function sortReferralsForInbox(
  referrals: readonly Referral[],
): readonly Referral[] {
  return [...referrals].sort((a, b) => {
    const aOpen = isOpenReferralStatus(a.status) ? 0 : 1;
    const bOpen = isOpenReferralStatus(b.status) ? 0 : 1;
    if (aOpen !== bOpen) {
      return aOpen - bOpen;
    }
    const aOverdue = a.status === 'overdue' ? 0 : 1;
    const bOverdue = b.status === 'overdue' ? 0 : 1;
    if (aOverdue !== bOverdue) {
      return aOverdue - bOverdue;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function partitionReferralInbox(referrals: readonly Referral[]): {
  readonly open: readonly Referral[];
  readonly closed: readonly Referral[];
} {
  const sorted = sortReferralsForInbox(referrals);
  return {
    open: sorted.filter((r) => isOpenReferralStatus(r.status)),
    closed: sorted.filter((r) => !isOpenReferralStatus(r.status)),
  };
}
