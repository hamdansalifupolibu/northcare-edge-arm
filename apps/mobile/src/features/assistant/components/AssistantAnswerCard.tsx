import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import type { ComposedAssistantAnswer, RichTextBlock } from '../domain/types';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly answer: ComposedAssistantAnswer;
};

function BlockView({ block }: { readonly block: RichTextBlock }) {
  if (block.kind === 'heading') {
    return <AppText variant="headingSmall">{block.text}</AppText>;
  }
  if (block.kind === 'bullet') {
    return <AppText variant="body">{`• ${block.text}`}</AppText>;
  }
  if (block.kind === 'safetyNote') {
    return (
      <AppText variant="caption" color="warning">
        {block.text}
      </AppText>
    );
  }
  return <AppText variant="body">{block.text}</AppText>;
}

export function AssistantAnswerCard({ answer }: Props) {
  return (
    <View style={{ gap: spacing.sm }} testID="ask-answer-card">
      {answer.developmentBanner ? (
        <AppText
          variant="caption"
          color="warning"
          accessibilityLabel={assistantStrings.accessibilityDevelopment}
        >
          {answer.developmentBanner}
        </AppText>
      ) : null}
      <AppText
        variant="title"
        accessibilityLabel={assistantStrings.accessibilityAnswerHeading}
        testID="ask-answer-heading"
      >
        {answer.heading}
      </AppText>
      <AppText variant="body" color="secondary">
        {answer.summary}
      </AppText>
      {answer.blocks.map((block, index) => (
        <BlockView key={`${block.kind}-${index}`} block={block} />
      ))}
      {answer.safetyNote ? (
        <AppText variant="caption" color="warning">
          {answer.safetyNote}
        </AppText>
      ) : null}
      <AppText variant="caption" color="secondary">
        {assistantStrings.contentVersion}: {answer.knowledgePackId} v
        {answer.knowledgePackVersion}
      </AppText>
    </View>
  );
}
