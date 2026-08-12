import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { AnswerSourceList } from '../components/AnswerSourceList';
import { AssistantAnswerCard } from '../components/AssistantAnswerCard';
import { AssistantBoundaryState } from '../components/AssistantBoundaryState';
import { AssistantFeatureShell } from '../components/AssistantFeatureShell';
import { AssistantFeedbackControls } from '../components/AssistantFeedbackControls';
import { useAssistantServices } from '../hooks/useAssistantServices';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { getAssistantResult } from '../session/assistantConversationStore';

export function AskAnswerScreen() {
  const assistantStrings = useAssistantStrings();
  const { answerId } = useLocalSearchParams<{ answerId?: string }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const services = useAssistantServices();
  const result = answerId ? getAssistantResult(answerId) : null;

  const goHome = (): void => router.replace('/(worker)');
  const goChat = (): void => router.replace('/(worker)/ask/chat');
  const shellProps = {
    title: assistantStrings.title,
    onBack: () => router.back(),
    onHome: goHome,
  };

  if (!result) {
    return (
      <AssistantFeatureShell {...shellProps} testID="ask-answer">
        <AppText variant="body">{assistantStrings.unsupportedTitle}</AppText>
        <AppButton label={assistantStrings.askAnother} onPress={goChat} />
      </AssistantFeatureShell>
    );
  }

  if (result.kind === 'privacyReviewRequired') {
    return (
      <AssistantFeatureShell {...shellProps} testID="ask-answer-privacy">
        <AppText variant="body" color="warning">
          {result.message}
        </AppText>
        <AppButton label={assistantStrings.askAnother} onPress={goChat} />
      </AssistantFeatureShell>
    );
  }

  if (result.kind === 'boundary') {
    return (
      <AssistantFeatureShell {...shellProps} testID="ask-answer-boundary">
        <AssistantBoundaryState boundary={result.boundary} />
        {result.boundary.relatedTopicIds.length > 0 ? (
          <AppText variant="caption" color="secondary">
            {assistantStrings.relatedTopics}
          </AppText>
        ) : null}
        {result.boundary.workflowLinks.map((link) => (
          <AppButton
            key={link.linkId}
            label={link.label}
            variant="secondary"
            onPress={() => router.push(link.route as never)}
          />
        ))}
        <AppButton label={assistantStrings.askAnother} onPress={goChat} />
        <AppButton
          label={assistantStrings.viewTopics}
          variant="tertiary"
          onPress={() => router.push('/(worker)/ask/topics')}
        />
      </AssistantFeatureShell>
    );
  }

  if (result.kind !== 'answer') {
    return (
      <AssistantFeatureShell {...shellProps} testID="ask-answer-fallback">
        <AppButton label={assistantStrings.askAnother} onPress={goChat} />
      </AssistantFeatureShell>
    );
  }

  const answer = result.answer;
  const primaryArticleId = answer.articleIds[0];

  return (
    <AssistantFeatureShell {...shellProps} testID="ask-answer">
      <AssistantAnswerCard answer={answer} />
      <View style={{ gap: spacing.md }}>
        <AnswerSourceList citations={answer.citations} />
        <AppButton
          label={assistantStrings.sources}
          variant="secondary"
          onPress={() =>
            router.push(
              `/(worker)/ask/sources?answerId=${encodeURIComponent(answer.answerId)}` as never,
            )
          }
        />
        {primaryArticleId ? (
          <AppButton
            label={assistantStrings.openArticle}
            variant="secondary"
            onPress={() =>
              router.push(`/(worker)/ask/article/${encodeURIComponent(primaryArticleId)}` as never)
            }
          />
        ) : null}
        {answer.workflowLinks.map((link) => (
          <AppButton
            key={link.linkId}
            label={link.label}
            variant="tertiary"
            onPress={() => router.push(link.route as never)}
          />
        ))}
        {services && primaryArticleId ? (
          <AssistantFeedbackControls
            onFeedback={async ({ feedbackCategory, contentIssueCategory }) => {
              await services.recordFeedback({
                articleId: primaryArticleId,
                knowledgePackId: answer.knowledgePackId,
                knowledgePackVersion: answer.knowledgePackVersion,
                answerMode: answer.mode,
                feedbackCategory,
                contentIssueCategory,
                accountId: session?.accountId ?? null,
              });
            }}
          />
        ) : null}
        <AppButton label={assistantStrings.askAnother} onPress={goChat} />
      </View>
    </AssistantFeatureShell>
  );
}
