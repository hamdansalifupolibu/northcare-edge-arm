import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

export function AssistantPrivacyNotice() {
  const assistantStrings = useAssistantStrings();
return (
    <View
      accessibilityRole="text"
      accessibilityLabel={assistantStrings.accessibilityPrivacy}
      style={{ gap: spacing.xs }}
      testID="ask-privacy-notice"
    >
      <AppText variant="caption" color="secondary">
        {assistantStrings.privacyReminder}
      </AppText>
    </View>
  );
}
