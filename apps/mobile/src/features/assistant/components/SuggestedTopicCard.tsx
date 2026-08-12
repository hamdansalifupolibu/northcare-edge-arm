import { Pressable, View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import type { KnowledgeTopicDefinition } from '../domain/types';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly topic: KnowledgeTopicDefinition;
  readonly onPress: () => void;
};

export function SuggestedTopicCard({ topic, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={assistantStrings.accessibilityTopic(topic.title)}
      onPress={onPress}
      style={{ minHeight: 48, paddingVertical: spacing.sm, gap: spacing.xs }}
      testID={`ask-topic-${topic.topicId}`}
    >
      <AppText variant="body">{topic.title}</AppText>
      <AppText variant="caption" color="secondary">
        {topic.description}
      </AppText>
      <View>
        <AppText variant="caption" color="secondary">
          {assistantStrings.offlineStatus}
        </AppText>
      </View>
    </Pressable>
  );
}
