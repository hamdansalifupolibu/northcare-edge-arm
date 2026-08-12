import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import type { AssistantBoundaryResult } from '../domain/types';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly boundary: AssistantBoundaryResult;
};

export function AssistantBoundaryState({ boundary }: Props) {
  const isUrgent = boundary.answerability === 'urgentBoundary';
  return (
    <View
      style={{ gap: spacing.sm }}
      accessibilityRole="text"
      accessibilityLabel={
        isUrgent
          ? assistantStrings.accessibilityUrgent
          : assistantStrings.accessibilityUnsupported
      }
      testID="ask-boundary-state"
    >
      {boundary.developmentBanner ? (
        <AppText variant="caption" color="warning">
          {boundary.developmentBanner}
        </AppText>
      ) : null}
      <AppText variant="title" color={isUrgent ? 'urgent' : 'primary'}>
        {boundary.heading}
      </AppText>
      <AppText variant="body">{boundary.body}</AppText>
      <AppText variant="caption" color="secondary">
        {isUrgent
          ? 'Use approved urgent assessment and referral procedures. Colour is not the only signal.'
          : assistantStrings.unsupportedTitle}
      </AppText>
    </View>
  );
}
