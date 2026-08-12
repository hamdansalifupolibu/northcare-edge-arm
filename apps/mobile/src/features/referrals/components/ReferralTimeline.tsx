import { View } from 'react-native';

import type { ReferralEvent } from '../../../data/domain/entities/entities';
import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';

type Props = {
  readonly events: readonly ReferralEvent[];
};

function labelForEvent(eventType: string): string {
  const map: Record<string, string> = {
    draft_created: 'Draft created',
    referral_confirmed: 'Referral confirmed',
    referral_edited: 'Referral edited',
    passport_issued: 'Passport issued',
    passport_reissued: 'Passport reissued',
    status_created: 'Status: created',
    status_caregiverInformed: 'Status: caregiver informed',
    status_journeyStarted: 'Status: journey started',
    status_facilityReached: 'Status: facility reached',
    status_patientReceived: 'Status: client received',
    status_completed: 'Status: completed',
    status_cancelled: 'Status: cancelled',
    status_overdue: 'Status: overdue',
    cancellation_note: 'Cancellation note',
  };
  return map[eventType] ?? eventType.replace(/_/g, ' ');
}

export function ReferralTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <AppText variant="body" color="secondary">
        No timeline events yet.
      </AppText>
    );
  }

  return (
    <View style={{ gap: spacing.md }} testID="referral-timeline">
      {events.map((event) => (
        <View key={event.id} style={{ gap: spacing.xs }}>
          <AppText variant="label">{labelForEvent(event.eventType)}</AppText>
          <AppText variant="caption" color="secondary">
            {event.occurredAt}
          </AppText>
          {event.notes ? (
            <AppText variant="body" color="secondary">
              {event.notes}
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}
