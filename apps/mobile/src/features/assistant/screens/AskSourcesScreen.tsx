import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton, AppText } from '../../../design-system';
import { AnswerSourceList } from '../components/AnswerSourceList';
import { AssistantFeatureShell } from '../components/AssistantFeatureShell';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { getStoredAnswer } from '../session/assistantConversationStore';

export function AskSourcesScreen() {
  const assistantStrings = useAssistantStrings();
  const { answerId } = useLocalSearchParams<{ answerId?: string }>();
  const router = useRouter();
  const answer = answerId ? getStoredAnswer(answerId) : null;

  return (
    <AssistantFeatureShell
      title={assistantStrings.sources}
      onBack={() => router.back()}
      onHome={() => router.replace('/(worker)')}
      testID="ask-sources"
    >
      {answer ? (
        <AnswerSourceList citations={answer.citations} />
      ) : (
        <AppText variant="body">{assistantStrings.sourceDetailsUnavailable}</AppText>
      )}
      <AppButton
        label={assistantStrings.askAnother}
        variant="secondary"
        onPress={() => router.replace('/(worker)/ask/chat')}
      />
    </AssistantFeatureShell>
  );
}
