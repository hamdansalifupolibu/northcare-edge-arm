import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import type { ReferralStatus } from '../../../data/domain/enums/domainEnums';
import { AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import {
  mapReferralServiceError,
  type ReferralDetails,
} from '../application/createReferralServices';
import { referralStatusLabel } from '../components/ReferralStatusChip';
import {
  ReferralActionStack,
  ReferralDetailSummaryCard,
  ReferralScreenScaffold,
} from '../components/ReferralOutcomeComponents';
import {
  ReferralStatusJourneyBar,
  ReferralStatusOptionCard,
  statusTransitionDescription,
} from '../components/UpdateReferralStatusComponents';
import { recommendedNextReferralStatus } from '../domain/referralInbox';
import { resolveRouteParam } from '../domain/resolveRouteParam';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function UpdateReferralStatusScreen() {
  const referralStrings = useReferralStrings();
  const actionLabels = useMemo(
    (): Partial<Record<ReferralStatus, string>> => ({
      caregiverInformed: referralStrings.caregiverInformedAction,
      journeyStarted: referralStrings.journeyStarted,
      facilityReached: referralStrings.facilityReached,
      patientReceived: referralStrings.clientReceived,
      completed: referralStrings.completeAction,
    }),
    [referralStrings],
  );
  const { referralId: referralIdParam } = useLocalSearchParams<{ referralId: string }>();
  const referralId = resolveRouteParam(referralIdParam);
  const router = useRouter();
  const { account, touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [details, setDetails] = useState<ReferralDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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

  const onTransition = useCallback(
    async (to: ReferralStatus) => {
      if (!services || !account || !referralId) return;
      setBusy(true);
      setError(null);
      try {
        await services.transitionStatus({
          referralId,
          accountId: account.accountId,
          to,
        });
        router.replace(`/(worker)/referrals/${referralId}`);
      } catch (err) {
        setError(mapReferralServiceError(err));
      } finally {
        setBusy(false);
      }
    },
    [services, account, referralId, router],
  );

  if (loading || !details) {
    return (
      <AppScreen>
        <LoadingState message={referralStrings.loading} />
      </AppScreen>
    );
  }

  const { referral } = details;
  const recommended = recommendedNextReferralStatus(referral.status);

  return (
    <ReferralScreenScaffold onBack={() => router.back()} testID="referral-update-status-screen">
      <View style={{ gap: spacing.sm }}>
        <AppText variant="headingLarge" style={{ fontWeight: '800' }}>
          {referralStrings.updateStatusTitle}
        </AppText>
        <AppText variant="body" color="secondary">
          {referralStrings.updateStatusSubtitle}
        </AppText>
      </View>

      <ReferralDetailSummaryCard
        referenceCode={referral.referenceCode ?? 'Referral'}
        clientName={details.clientDisplayName}
        status={referral.status}
        rows={[
          {
            label: referralStrings.receivingFacilityLabel,
            value: details.receivingFacility?.name ?? '—',
          },
        ]}
      />

      <ReferralStatusJourneyBar currentStatus={referral.status} />

      <AppText variant="caption" color="secondary">
        {referralStrings.updateStatusSavedHint}
      </AppText>
      <AppText variant="caption" color="secondary">
        {referralStrings.receiptStatusUnchanged}
      </AppText>

      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <ReferralActionStack>
        {details.allowedTransitions
          .filter((status) => status !== 'cancelled' && status !== 'overdue')
          .map((status) => {
            const label = actionLabels[status] ?? referralStatusLabel(status);
            const isRecommended = recommended === status;
            return (
              <ReferralStatusOptionCard
                key={status}
                title={label}
                description={statusTransitionDescription(status, referralStrings)}
                recommended={isRecommended}
                disabled={busy}
                onPress={() => void onTransition(status)}
                testID={
                  isRecommended ? 'referral-update-recommended' : `referral-update-${status}`
                }
              />
            );
          })}
      </ReferralActionStack>
    </ReferralScreenScaffold>
  );
}
