import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../../../design-system';
import { AssistantFeatureShell } from '../components/AssistantFeatureShell';
import { AssistantUnavailableState } from '../components/AssistantUnavailableState';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { getAssistantResult } from '../session/assistantConversationStore';

export function AskUnavailableScreen() {
  const assistantStrings = useAssistantStrings();
  const { answerId } = useLocalSearchParams<{ answerId?: string }>();
  const router = useRouter();
  const result = answerId ? getAssistantResult(answerId) : null;
  const message =
    result?.kind === 'unavailable'
      ? result.message
      : result?.kind === 'boundary'
        ? result.boundary.body
        : assistantStrings.contentUnavailable;

  return (
    <AssistantFeatureShell
      title={assistantStrings.title}
      onBack={() => router.back()}
      onHome={() => router.replace('/(worker)')}
      testID="ask-unavailable"
    >
      <AssistantUnavailableState message={message} />
      <AppButton
        label={assistantStrings.viewTopics}
        onPress={() => router.push('/(worker)/ask/topics')}
      />
      <AppButton
        label={assistantStrings.askAnother}
        variant="secondary"
        onPress={() => router.replace('/(worker)/ask/chat')}
      />
    </AssistantFeatureShell>
  );
}
