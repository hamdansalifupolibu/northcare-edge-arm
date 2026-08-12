import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { AppButton, AppText } from '../../../design-system';
import { SuggestedTopicCard } from '../components/SuggestedTopicCard';
import { AssistantFeatureShell } from '../components/AssistantFeatureShell';
import { useAssistantServices } from '../hooks/useAssistantServices';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import {
  setAssistantDraftQuestion,
  setAssistantSelectedTopicId,
} from '../session/assistantConversationStore';

export function AskTopicsScreen() {
  const assistantStrings = useAssistantStrings();
  const router = useRouter();
  const services = useAssistantServices();
  const topics = useMemo(() => services?.listTopics() ?? [], [services]);

  return (
    <AssistantFeatureShell
      title={assistantStrings.suggestedTopics}
      onBack={() => router.back()}
      onHome={() => router.replace('/(worker)')}
      testID="ask-topics"
    >
      {topics.length === 0 ? (
        <AppText variant="body">{assistantStrings.noTopics}</AppText>
      ) : (
        topics.map((topic) => (
          <SuggestedTopicCard
            key={topic.topicId}
            topic={topic}
            onPress={() => {
              setAssistantSelectedTopicId(topic.topicId);
              setAssistantDraftQuestion(`What is ${topic.title}`);
              router.replace('/(worker)/ask/chat');
            }}
          />
        ))
      )}
      <AppButton
        label={assistantStrings.title}
        variant="secondary"
        onPress={() => router.replace('/(worker)/ask/chat')}
      />
    </AssistantFeatureShell>
  );
}
