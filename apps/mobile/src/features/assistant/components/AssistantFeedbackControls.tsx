import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import type { ContentIssueCategory, FeedbackCategory } from '../domain/statuses';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly disabled?: boolean;
  readonly onFeedback: (input: {
    readonly feedbackCategory: FeedbackCategory;
    readonly contentIssueCategory?: ContentIssueCategory | null;
  }) => Promise<void>;
};

export function AssistantFeedbackControls({ disabled, onFeedback }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (
    feedbackCategory: FeedbackCategory,
    contentIssueCategory?: ContentIssueCategory | null,
  ) => {
    if (busy || saved || disabled) {
      return;
    }
    setBusy(true);
    try {
      await onFeedback({ feedbackCategory, contentIssueCategory });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.sm }} testID="ask-feedback-controls">
      {saved ? (
        <AppText variant="caption" color="stable">
          {assistantStrings.feedbackSaved}
        </AppText>
      ) : (
        <>
          <AppButton
            label={assistantStrings.feedbackHelpful}
            variant="secondary"
            disabled={busy || disabled}
            onPress={() => {
              void submit('helpful');
            }}
            testID="ask-feedback-helpful"
          />
          <AppButton
            label={assistantStrings.feedbackNotHelpful}
            variant="secondary"
            disabled={busy || disabled}
            onPress={() => {
              void submit('notHelpful');
            }}
            testID="ask-feedback-not-helpful"
          />
          <AppButton
            label={assistantStrings.feedbackReport}
            variant="tertiary"
            disabled={busy || disabled}
            onPress={() => {
              void submit('reportContentIssue', 'doesNotAnswerQuestion');
            }}
            testID="ask-feedback-report"
          />
        </>
      )}
    </View>
  );
}
