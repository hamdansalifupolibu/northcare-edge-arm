import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly message?: string | null;
};

export function AssistantUnavailableState({ message }: Props) {
  return (
    <View style={{ gap: spacing.sm }} testID="ask-unavailable-state">
      <AppText variant="title">{assistantStrings.unavailableTitle}</AppText>
      <AppText variant="body">{message ?? assistantStrings.contentUnavailable}</AppText>
    </View>
  );
}
