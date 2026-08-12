import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapReferralServiceError } from '../application/createReferralServices';
import {
  ClinicalNotesField,
  CreateReferralErrorBanner,
  CreateReferralInfoBanner,
} from '../components/CreateReferralComponents';
import {
  ReferralHeroCard,
  ReferralPrimaryFooterButton,
  ReferralScreenScaffold,
} from '../components/ReferralOutcomeComponents';
import { ReferralShieldCheckIcon } from '../components/ReferralListIcons';
import { resolveRouteParam } from '../domain/resolveRouteParam';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function CancelReferralScreen() {
  const referralStrings = useReferralStrings();
  const { referralId: referralIdParam } = useLocalSearchParams<{ referralId: string }>();
  const referralId = resolveRouteParam(referralIdParam);
  const router = useRouter();
  const { account } = useAuthSession();
  const services = useReferralServices();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!referralId) {
    return (
      <AppScreen>
        <LoadingState message={referralStrings.missing} />
      </AppScreen>
    );
  }

  return (
    <ReferralScreenScaffold
      onBack={() => router.back()}
      testID="referral-cancel-screen"
      footer={
        <ReferralPrimaryFooterButton
          label={referralStrings.cancelAction}
          onPress={() => {
            if (!services || !account || !referralId) return;
            setBusy(true);
            setError(null);
            void services
              .cancelReferral({
                referralId,
                accountId: account.accountId,
                notes: notes.trim() || null,
              })
              .then(() => router.replace('/(worker)/referrals'))
              .catch((err) => setError(mapReferralServiceError(err)))
              .finally(() => setBusy(false));
          }}
          disabled={busy}
          loading={busy}
          testID="referral-cancel-confirm"
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        <ReferralHeroCard
          icon={<ReferralShieldCheckIcon size={40} />}
          title={referralStrings.cancelTitle}
          body={referralStrings.cancelConfirm}
        />

        <CreateReferralInfoBanner body={referralStrings.cancelNotesHint} />

        <ClinicalNotesField
          label={referralStrings.cancelNotesLabel}
          hint={referralStrings.cancelNotesHint}
          placeholder={referralStrings.cancelNotesPlaceholder}
          value={notes}
          onChangeText={setNotes}
          testID="referral-cancel-notes"
        />

        {error ? <CreateReferralErrorBanner message={error} /> : null}
      </View>
    </ReferralScreenScaffold>
  );
}
