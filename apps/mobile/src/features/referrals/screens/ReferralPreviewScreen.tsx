import { View } from 'react-native';

import { AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { getAppConfig } from '../../../config/appConfig';
import { spacing } from '../../../theme';
import {
  countApprovedForPilotReferralReasons,
  listAllRegisteredReferralReasonsForInventory,
  listLoadableReferralReasons,
} from '../content/registry';
import { useReferralStrings } from '../hooks/useReferralStrings';

/**
 * Development-only preview. Production layout redirects away via route access.
 */
export function ReferralPreviewScreen() {
  const referralStrings = useReferralStrings();
const env = getAppConfig().appEnv;
  const loadable = listLoadableReferralReasons(env);
  const all = listAllRegisteredReferralReasonsForInventory();

  return (
    <ScrollableAppScreen>
      <View style={{ gap: spacing.lg }} testID="referral-preview-screen">
        <ScreenTitle>{referralStrings.developmentPreviewTitle}</ScreenTitle>
        <AppText variant="caption" color="warning">
          {referralStrings.reasonDevBanner}
        </AppText>
        <AppText variant="body">
          Environment: {env}. APPROVED_FOR_PILOT reasons:{' '}
          {countApprovedForPilotReferralReasons()}. Loadable now: {loadable.length}.
          Registered total: {all.length}.
        </AppText>
        {all.map((reason) => (
          <View key={reason.reasonCode} style={{ gap: spacing.xs }}>
            <AppText variant="label">{reason.label}</AppText>
            <AppText variant="caption" color="secondary">
              {reason.reasonCode} · {reason.status}
            </AppText>
          </View>
        ))}
      </View>
    </ScrollableAppScreen>
  );
}
