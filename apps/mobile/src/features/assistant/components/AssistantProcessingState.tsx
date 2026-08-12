import { View } from 'react-native';

import { AppText, LoadingState } from '../../../design-system';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

export function AssistantProcessingState() {
  const assistantStrings = useAssistantStrings();
return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={assistantStrings.accessibilitySearching}
      testID="ask-processing"
    >
      <LoadingState message={assistantStrings.searching} />
      <AppText variant="caption" color="secondary">
        {assistantStrings.searching}
      </AppText>
    </View>
  );
}
