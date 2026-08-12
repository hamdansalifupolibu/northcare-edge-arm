import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton, AppText } from '../../../design-system';
import { ReferralCelebrationModal } from '../components/ReferralCelebrationModal';
import {
  ReferralActionStack,
  ReferralNextStepCard,
  ReferralScreenScaffold,
  ReferralSuccessHero,
} from '../components/ReferralOutcomeComponents';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function ReferralSuccessScreen() {
  const referralStrings = useReferralStrings();
  const { clientId: clientIdParam, referralId: referralIdParam } = useLocalSearchParams<{
    clientId: string;
    referralId: string;
  }>();
  const clientId = Array.isArray(clientIdParam) ? clientIdParam[0] : clientIdParam;
  const referralId = Array.isArray(referralIdParam) ? referralIdParam[0] : referralIdParam;
  const router = useRouter();
  const [showCongrats, setShowCongrats] = useState(true);

  return (
    <ReferralScreenScaffold
      onBack={() => router.replace(`/(worker)/referrals/${referralId}`)}
      testID="referral-success-screen"
    >
      <ReferralSuccessHero title={referralStrings.successTitle} body={referralStrings.successSubtitle} />

      <ReferralNextStepCard
        title={referralStrings.nextStepLabel}
        body={referralStrings.successNextHint}
        hint={referralStrings.caregiverPassportHint}
      />

      <ReferralActionStack>
        <AppButton
          label={referralStrings.viewPassport}
          onPress={() => router.replace(`/(worker)/referrals/${referralId}/passport`)}
          testID="referral-success-passport"
        />
        <AppButton
          label={referralStrings.scheduleReferralFollowUp}
          variant="secondary"
          onPress={() =>
            router.push(
              `/(worker)/more/reminders/create?clientId=${clientId}&referralId=${referralId}` as import('expo-router').Href,
            )
          }
          testID="referral-success-schedule-follow-up"
        />
        <AppButton
          label={referralStrings.viewDetails}
          variant="secondary"
          onPress={() => router.replace(`/(worker)/referrals/${referralId}`)}
        />
        <AppButton
          label="Back to client"
          variant="tertiary"
          onPress={() => router.replace(`/(worker)/clients/${clientId}`)}
        />
      </ReferralActionStack>

      <AppText variant="caption" color="secondary">
        {referralStrings.successPassportPdfHint}
      </AppText>

      <ReferralCelebrationModal
        visible={showCongrats}
        title={referralStrings.createSuccessModalTitle}
        body={referralStrings.createSuccessModalBody}
        continueLabel={referralStrings.createSuccessModalContinue}
        accessibilityLabel={referralStrings.createSuccessModalA11y}
        testID="referral-create-success-modal"
        continueTestID="referral-create-success-continue"
        onContinue={() => setShowCongrats(false)}
      />
    </ReferralScreenScaffold>
  );
}
