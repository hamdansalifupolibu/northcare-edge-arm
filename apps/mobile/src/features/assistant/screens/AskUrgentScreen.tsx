import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../../../design-system';
import { AssistantBoundaryState } from '../components/AssistantBoundaryState';
import { AssistantFeatureShell } from '../components/AssistantFeatureShell';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { getStoredBoundary } from '../session/assistantConversationStore';

export function AskUrgentScreen() {
  const assistantStrings = useAssistantStrings();
  const { answerId } = useLocalSearchParams<{ answerId?: string }>();
  const router = useRouter();
  const boundary = answerId ? getStoredBoundary(answerId) : null;

  return (
    <AssistantFeatureShell
      title={assistantStrings.urgentTitle}
      onBack={() => router.back()}
      onHome={() => router.replace('/(worker)')}
      testID="ask-urgent"
    >
      {boundary ? (
        <AssistantBoundaryState boundary={boundary} />
      ) : (
        <AssistantBoundaryState
          boundary={{
            answerId: answerId ?? 'unknown',
            answerability: 'urgentBoundary',
            heading: assistantStrings.urgentTitle,
            body: 'Do not wait for the assistant. Use the approved urgent-assessment and referral procedure, and contact the authorised supervisor or emergency pathway available to you.',
            relatedTopicIds: [],
            workflowLinks: [
              {
                linkId: 'referrals',
                label: 'View referrals',
                route: '/(worker)/referrals',
              },
            ],
            mode: 'UNAVAILABLE',
            answeredAt: new Date().toISOString(),
            developmentBanner: null,
          }}
        />
      )}
      {boundary?.workflowLinks.map((link) => (
        <AppButton
          key={link.linkId}
          label={link.label}
          variant="secondary"
          onPress={() => router.push(link.route as never)}
        />
      ))}
      <AppButton
        label={assistantStrings.askAnother}
        onPress={() => router.replace('/(worker)/ask/chat')}
      />
    </AssistantFeatureShell>
  );
}
