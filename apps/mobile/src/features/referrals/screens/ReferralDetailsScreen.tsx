import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppScreen, AppStateView, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { ReferralDetails } from '../application/createReferralServices';
import {
  ReferralActionStack,
  ReferralDetailSummaryCard,
  ReferralNextStepCard,
  ReferralQuickActionRow,
  ReferralScreenScaffold,
} from '../components/ReferralOutcomeComponents';
import { ReferralPencilIcon, ReferralVerifyScanIcon } from '../components/ReferralListIcons';
import { getReferralNextAction, isReferralEditable } from '../domain/referralInbox';
import { resolveRouteParam } from '../domain/resolveRouteParam';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function ReferralDetailsScreen() {
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const summaryRows = useMemo(() => {
    if (!details) return [];
    const rows = [
      {
        label: referralStrings.receivingFacilityLabel,
        value: details.receivingFacility?.name ?? '—',
      },
      {
        label: referralStrings.sourceFacilityLabel,
        value: details.sourceFacility?.name ?? '—',
      },
      {
        label: referralStrings.priorityLabel,
        value: details.referral.priority,
      },
    ];
    if (details.reason?.label) {
      rows.push({ label: referralStrings.reasonTitle, value: details.reason.label });
    }
    if (details.referral.workerNotes) {
      rows.push({
        label: referralStrings.clinicalSummaryLabel,
        value: details.referral.workerNotes,
      });
    }
    return rows;
  }, [details, referralStrings]);

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

  const { referral } = details;
  const next = getReferralNextAction(referral.status);
  const editable = isReferralEditable(referral.status);

  return (
    <ReferralScreenScaffold onBack={() => router.back()} testID="referral-details-screen">
      <ReferralDetailSummaryCard
        referenceCode={referral.referenceCode ?? 'Referral'}
        clientName={details.clientDisplayName}
        status={referral.status}
        rows={summaryRows}
      />

      <AppText variant="caption" color="secondary">
        {referralStrings.savedOnDevice}
      </AppText>

      {next ? (
        <ReferralNextStepCard
          title={referralStrings.nextStepLabel}
          body={next.hint}
          hint={next.label}
        />
      ) : null}

      <ReferralActionStack>
        {editable ? (
          <ReferralQuickActionRow
            title={referralStrings.editReferral}
            description={referralStrings.editReferralSubtitle}
            icon={<ReferralPencilIcon size={20} />}
            onPress={() => router.push(`/(worker)/referrals/${referral.id}/edit`)}
            testID="referral-edit"
            variant="primary"
          />
        ) : null}

        {next ? (
          <ReferralQuickActionRow
            title={next.label}
            description={next.hint}
            onPress={() => router.push(`/(worker)/referrals/${referral.id}/update-status`)}
            testID="referral-next-action-button"
            variant={editable ? 'secondary' : 'primary'}
          />
        ) : null}

        <ReferralQuickActionRow
          title={referralStrings.showPassportPrimary}
          description={referralStrings.caregiverPassportHint}
          icon={<ReferralVerifyScanIcon size={20} />}
          onPress={() => router.push(`/(worker)/referrals/${referral.id}/passport`)}
          testID="referral-view-passport"
          variant="secondary"
        />

        <ReferralQuickActionRow
          title={referralStrings.timelineTitle}
          onPress={() => router.push(`/(worker)/referrals/${referral.id}/timeline`)}
          testID="referral-view-timeline"
        />

        <ReferralQuickActionRow
          title={referralStrings.updateStatusTitle}
          onPress={() => router.push(`/(worker)/referrals/${referral.id}/update-status`)}
          testID="referral-update-status"
        />

        <ReferralQuickActionRow
          title={referralStrings.scheduleReferralFollowUp}
          onPress={() =>
            router.push(
              `/(worker)/more/reminders/create?clientId=${referral.clientId}&referralId=${referral.id}` as import('expo-router').Href,
            )
          }
          testID="referral-create-reminder"
        />

        {referral.status !== 'cancelled' && referral.status !== 'completed' ? (
          <ReferralQuickActionRow
            title={referralStrings.cancelTitle}
            onPress={() => router.push(`/(worker)/referrals/${referral.id}/cancel`)}
            testID="referral-cancel"
          />
        ) : null}
      </ReferralActionStack>
    </ReferralScreenScaffold>
  );
}
