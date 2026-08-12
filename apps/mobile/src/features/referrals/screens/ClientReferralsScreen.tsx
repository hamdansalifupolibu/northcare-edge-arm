import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import type { Referral } from '../../../data/domain/entities/entities';
import { AppScreen, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import {
  ClientReferralHistoryRow,
  ClientReferralsScreenLayout,
  ReferralEmptyHistoryCard,
} from '../components/ReferralOutcomeComponents';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function ClientReferralsScreen() {
  const referralStrings = useReferralStrings();
  const { clientId: clientIdParam } = useLocalSearchParams<{ clientId: string }>();
  const clientId = Array.isArray(clientIdParam) ? clientIdParam[0] : clientIdParam;
  const router = useRouter();
  const { touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [items, setItems] = useState<readonly Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!services || !clientId) return;
    setLoading(true);
    try {
      setItems(await services.getClientReferralHistory(clientId));
    } finally {
      setLoading(false);
    }
  }, [services, clientId]);

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

  return (
    <ClientReferralsScreenLayout
      title={referralStrings.clientReferralsTitle}
      subtitle={referralStrings.clientReferralsSubtitle}
      prepareLabel={referralStrings.createReferral}
      emptyTitle={referralStrings.clientReferralsEmptyTitle}
      emptyBody={referralStrings.clientReferralsEmptyBody}
      onBack={() => router.back()}
      onPrepare={() =>
        router.push(`/(worker)/clients/${clientId}/referrals/create?origin=workerInitiated`)
      }
    >
      {items.length === 0 ? (
        <ReferralEmptyHistoryCard
          title={referralStrings.clientReferralsEmptyTitle}
          body={referralStrings.clientReferralsEmptyBody}
        />
      ) : (
        <View style={{ gap: spacing.sm }} testID="client-referrals-list">
          {items.map((item) => (
            <ClientReferralHistoryRow
              key={item.id}
              referral={item}
              onPress={() => router.push(`/(worker)/referrals/${item.id}`)}
            />
          ))}
        </View>
      )}
    </ClientReferralsScreenLayout>
  );
}
