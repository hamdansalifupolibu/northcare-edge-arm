import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

export function AskNorthCareScopeCard() {
  const assistantStrings = useAssistantStrings();
return (
    <View
      accessibilityRole="text"
      accessibilityLabel={assistantStrings.accessibilityScope}
      style={{ gap: spacing.xs }}
      testID="ask-scope-card"
    >
      <AppText variant="body">{assistantStrings.scope}</AppText>
    </View>
  );
}
