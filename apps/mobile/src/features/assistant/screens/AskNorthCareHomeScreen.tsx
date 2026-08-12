import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  AppButton,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { AskNorthCareScopeCard } from '../components/AskNorthCareScopeCard';
import { AssistantPrivacyNotice } from '../components/AssistantPrivacyNotice';
import { AssistantProcessingState } from '../components/AssistantProcessingState';
import { AssistantQuestionInput } from '../components/AssistantQuestionInput';
import { AssistantUnavailableState } from '../components/AssistantUnavailableState';
import { DevelopmentAssistantBanner } from '../components/DevelopmentAssistantBanner';
import { SuggestedTopicCard } from '../components/SuggestedTopicCard';
import { useAssistantServices } from '../hooks/useAssistantServices';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import {
  getAssistantDraftQuestion,
  setAssistantDraftQuestion,
  setAssistantSelectedTopicId,
} from '../session/assistantConversationStore';

function routeForResult(result: {
  kind: string;
  answer?: { answerId: string };
  boundary?: { answerId: string; answerability: string };
  answerId?: string;
}): string {
  if (result.kind === 'answer' && result.answer) {
    return `/(worker)/ask/answer?answerId=${encodeURIComponent(result.answer.answerId)}`;
  }
  if (result.kind === 'privacyReviewRequired' && result.answerId) {
    return `/(worker)/ask/answer?answerId=${encodeURIComponent(result.answerId)}`;
  }
  if (result.kind === 'unavailable' && result.answerId) {
    return `/(worker)/ask/unavailable?answerId=${encodeURIComponent(result.answerId)}`;
  }
  if (result.kind === 'boundary' && result.boundary) {
    if (result.boundary.answerability === 'urgentBoundary') {
      return `/(worker)/ask/urgent?answerId=${encodeURIComponent(result.boundary.answerId)}`;
    }
    return `/(worker)/ask/answer?answerId=${encodeURIComponent(result.boundary.answerId)}`;
  }
  return '/(worker)/ask/unavailable';
}

/** Stage 13 retrieval reference home (secondary). Primary Ask NorthCare entry is the chat screen. */
export function AskNorthCareHomeScreen() {
  const assistantStrings = useAssistantStrings();
const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const services = useAssistantServices();
  const [question, setQuestion] = useState(getAssistantDraftQuestion());
  const [processing, setProcessing] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const [pendingPrivacyQuestion, setPendingPrivacyQuestion] = useState<string | null>(null);

  const availability = services?.getAvailability();
  const topics = useMemo(() => services?.listTopics() ?? [], [services]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const runAsk = useCallback(
    async (text: string, acknowledgePrivacyWarning = false, topicId?: string | null) => {
      if (!services || processing) {
        return;
      }
      setProcessing(true);
      setPrivacyMessage(null);
      try {
        const result = await services.ask({
          question: text,
          selectedTopicId: topicId ?? null,
          accountId: session?.accountId ?? null,
          acknowledgePrivacyWarning,
        });
        if (result.kind === 'privacyReviewRequired') {
          setPrivacyMessage(result.message);
          setPendingPrivacyQuestion(text);
          return;
        }
        setPendingPrivacyQuestion(null);
        router.push(routeForResult(result) as never);
      } finally {
        setProcessing(false);
      }
    },
    [services, processing, session?.accountId, router],
  );

  if (!services) {
    return (
      <ScrollableAppScreen testID="ask-home">
        <LoadingState message={assistantStrings.searching} />
      </ScrollableAppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="ask-home">
      <ScreenTitle>{assistantStrings.title}</ScreenTitle>
      {availability?.developmentOnly ? <DevelopmentAssistantBanner /> : null}
      <AskNorthCareScopeCard />
      <AssistantPrivacyNotice />
      <AppText variant="caption" color="secondary">
        {assistantStrings.offlineStatus}
      </AppText>

      {!availability?.contentAvailable ? (
        <AssistantUnavailableState message={availability?.message} />
      ) : (
        <View style={{ gap: spacing.md }}>
          <AssistantQuestionInput
            value={question}
            editable={!processing}
            onChangeText={(value) => {
              setQuestion(value);
              setAssistantDraftQuestion(value);
            }}
          />
          {privacyMessage ? (
            <View style={{ gap: spacing.sm }}>
              <AppText variant="body" color="warning">
                {privacyMessage}
              </AppText>
              <AppButton
                label={assistantStrings.privacyContinue}
                onPress={() => {
                  if (pendingPrivacyQuestion) {
                    void runAsk(pendingPrivacyQuestion, true);
                  }
                }}
              />
              <AppButton
                label={assistantStrings.privacyCancel}
                variant="secondary"
                onPress={() => {
                  setPrivacyMessage(null);
                  setPendingPrivacyQuestion(null);
                }}
              />
            </View>
          ) : null}
          {processing ? <AssistantProcessingState /> : null}
          <AppButton
            label={assistantStrings.ask}
            disabled={processing || !question.trim()}
            onPress={() => {
              void runAsk(question);
            }}
            testID="ask-submit"
          />
          <AppText variant="headingSmall">{assistantStrings.suggestedTopics}</AppText>
          {topics.length === 0 ? (
            <AppText variant="body" color="secondary">
              {assistantStrings.noTopics}
            </AppText>
          ) : (
            topics.map((topic) => (
              <SuggestedTopicCard
                key={topic.topicId}
                topic={topic}
                onPress={() => {
                  setAssistantSelectedTopicId(topic.topicId);
                  setQuestion(topic.title);
                  setAssistantDraftQuestion(topic.title);
                  void runAsk(`What is ${topic.title}`, false, topic.topicId);
                }}
              />
            ))
          )}
          <AppButton
            label={assistantStrings.viewTopics}
            variant="secondary"
            onPress={() => router.push('/(worker)/ask/topics')}
          />
          <AppButton
            label={assistantStrings.clearConversation}
            variant="tertiary"
            onPress={() => {
              Alert.alert(assistantStrings.clearConversation, assistantStrings.clearConfirm, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    services.clearConversation();
                    setQuestion('');
                    setPrivacyMessage(null);
                  },
                },
              ]);
            }}
          />
        </View>
      )}
    </ScrollableAppScreen>
  );
}
