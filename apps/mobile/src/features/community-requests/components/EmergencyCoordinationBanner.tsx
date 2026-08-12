import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { semanticColors, spacing } from '../../../theme';

/**
 * Calm emergency coordination notice — emergency requests only.
 * No flashing, sound, or claim that NorthCare placed a call.
 */
export function EmergencyCoordinationBanner() {
  const t = useTranslation();
  const accessibilityLabel = [
    t.communityRequests.emergencyBannerTitle,
    t.communityRequests.emergencyCall112,
    t.communityRequests.emergencyLiveIntegrationPending,
  ].join('. ');

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      testID="community-request-emergency-banner"
      style={{
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderWidth: 1,
        borderColor: semanticColors.status.urgent,
        backgroundColor: semanticColors.status.urgentBackground,
        borderRadius: 8,
      }}
    >
      <AppText variant="label" color="urgent">
        {t.communityRequests.emergencyBannerTitle}
      </AppText>
      <AppText variant="caption" color="secondary">
        {t.communityRequests.emergencyCall112}
      </AppText>
      <AppText variant="caption" color="secondary">
        {t.communityRequests.emergencyLiveIntegrationPending}
      </AppText>
    </View>
  );
}
