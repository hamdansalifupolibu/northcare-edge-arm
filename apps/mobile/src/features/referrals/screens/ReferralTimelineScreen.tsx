import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppScreen, AppStateView, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { ReferralDetails } from '../application/createReferralServices';
import { ReferralTimeline } from '../components/ReferralTimeline';
import { ReferralScreenScaffold } from '../components/ReferralOutcomeComponents';
import { resolveRouteParam } from '../domain/resolveRouteParam';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function ReferralTimelineScreen() {
  const referralStrings = useReferralStrings();
  const { referralId: referralIdParam } = useLocalSearchParams<{ referralId: string }>();
  const referralId = resolveRouteParam(referralIdParam);
  const router = useRouter();
  const { touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [details, setDetails] = useState<ReferralDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!services || !referralId) return;
    setLoading(true);
    try {
      setDetails(await services.getReferralDetails(referralId));
    } finally {
      setLoading(false);
    }
  }, [services, referralId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={referralStrings.loading} />
      </AppScreen>
    );
  }

  if (!details) {
    return (
      <AppScreen>
        <AppStateView
          variant="empty"
          heading={referralStrings.missing}
          explanation={referralStrings.listEmpty}
        />
      </AppScreen>
    );
  }

  return (
    <ReferralScreenScaffold onBack={() => router.back()} testID="referral-timeline-screen">
      <View style={{ gap: spacing.md }}>
        <AppText variant="headingLarge" style={{ fontWeight: '800' }}>
          {referralStrings.timelineTitle}
        </AppText>
        <ReferralTimeline events={details.events} />
      </View>
    </ReferralScreenScaffold>
  );
}
