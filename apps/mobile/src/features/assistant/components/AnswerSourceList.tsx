import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import type { AnswerCitation } from '../domain/types';
import { useAssistantStrings } from '../hooks/useAssistantStrings';

type Props = {
  readonly citations: readonly AnswerCitation[];
};

export function AnswerSourceList({ citations }: Props) {
  return (
    <View
      style={{ gap: spacing.md }}
      accessibilityLabel={assistantStrings.accessibilitySources}
      testID="ask-source-list"
    >
      <AppText variant="headingSmall">{assistantStrings.sources}</AppText>
      {citations.map((citation) => (
        <View key={`${citation.sourceId}-${citation.articleId}`} style={{ gap: spacing.xs }}>
          <AppText variant="body">
            {citation.title ?? assistantStrings.sourceDetailsUnavailable}
          </AppText>
          <AppText variant="caption" color="secondary">
            {[
              citation.issuingOrganisation,
              citation.versionOrYear,
              citation.section,
              `Pack v${citation.knowledgePackVersion}`,
            ]
              .filter(Boolean)
              .join(' · ') || assistantStrings.sourceDetailsUnavailable}
          </AppText>
        </View>
      ))}
    </View>
  );
}
