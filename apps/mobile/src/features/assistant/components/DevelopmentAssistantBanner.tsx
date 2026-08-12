import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly message?: string;
};

export function DevelopmentAssistantBanner({
  message = assistantStrings.developmentBanner,
}: Props) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={assistantStrings.accessibilityDevelopment}
      style={{ gap: spacing.xs }}
      testID="ask-development-banner"
    >
      <AppText variant="caption" color="warning">
        {message}
      </AppText>
    </View>
  );
}
