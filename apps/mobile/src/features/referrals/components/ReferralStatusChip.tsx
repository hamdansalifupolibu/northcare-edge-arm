import type { StatusChipTone } from '../../../design-system';
import { StatusChip } from '../../../design-system';
import type { ReferralStatus } from '../../../data/domain/enums/domainEnums';

const LABELS: Record<ReferralStatus, string> = {
  draft: 'Draft',
  created: 'Created',
  caregiverInformed: 'Caregiver informed',
  journeyStarted: 'Journey started',
  facilityReached: 'Facility reached',
  patientReceived: 'Client received',
  completed: 'Completed',
  cancelled: 'Cancelled',
  overdue: 'Overdue',
};

const TONES: Record<ReferralStatus, StatusChipTone> = {
  draft: 'neutral',
  created: 'information',
  caregiverInformed: 'information',
  journeyStarted: 'information',
  facilityReached: 'warning',
  patientReceived: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  overdue: 'urgent',
};

type Props = {
  readonly status: ReferralStatus;
};

export function ReferralStatusChip({ status }: Props) {
  return <StatusChip label={LABELS[status]} tone={TONES[status]} hidePrefix />;
}

export function referralStatusLabel(status: ReferralStatus): string {
  return LABELS[status];
}
