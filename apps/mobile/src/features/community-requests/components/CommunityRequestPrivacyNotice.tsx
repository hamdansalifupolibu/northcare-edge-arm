import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';

export function CommunityRequestPrivacyNotice(props: {
  readonly emergency?: boolean;
}) {
  const t = useTranslation();
  return (
    <View style={{ gap: spacing.xs }} testID="community-request-privacy-notice">
      <AppText variant="caption" color="secondary">
        {t.communityRequests.privacyNotice}
      </AppText>
      {props.emergency ? (
        <AppText
          variant="caption"
          color="secondary"
          testID="community-request-emergency-privacy"
        >
          {t.communityRequests.emergencyPrivacyReminder}
        </AppText>
      ) : null}
      <AppText variant="caption" color="secondary">
        {t.communityRequests.clientLinkNotice}
      </AppText>
    </View>
  );
}
