import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { spacing } from '../../../theme';
import { AssistantFeatureShell } from '../components/AssistantFeatureShell';
import { DevelopmentAssistantBanner } from '../components/DevelopmentAssistantBanner';
import { useAssistantServices } from '../hooks/useAssistantServices';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { getPackForArticle } from '../content/registry';

export function AskArticleScreen() {
  const assistantStrings = useAssistantStrings();
  const { articleId } = useLocalSearchParams<{ articleId?: string }>();
  const router = useRouter();
  const services = useAssistantServices();
  const article = articleId && services ? services.getArticle(articleId) : null;
  const pack = articleId ? getPackForArticle(articleId) : null;

  const goHome = (): void => router.replace('/(worker)');
  const goChat = (): void => router.replace('/(worker)/ask/chat');

  if (!article) {
    return (
      <AssistantFeatureShell
        title={assistantStrings.title}
        onBack={() => router.back()}
        onHome={goHome}
        testID="ask-article-missing"
      >
        <AppText variant="body">{assistantStrings.articleNotFound}</AppText>
        <AppButton label={assistantStrings.title} onPress={goChat} />
      </AssistantFeatureShell>
    );
  }

  return (
    <AssistantFeatureShell
      title={article.title}
      subtitle={article.summary}
      onBack={() => router.back()}
      onHome={goHome}
      testID="ask-article"
    >
      {pack?.developmentBanner ? (
        <DevelopmentAssistantBanner message={pack.developmentBanner} />
      ) : null}
      {article.status === 'RETIRED' ? (
        <AppText variant="body" color="warning">
          {assistantStrings.retiredArticle}
        </AppText>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {article.approvedAnswer.map((block, index) => (
          <AppText key={`a-${index}`} variant="body">
            {block.kind === 'bullet' ? `• ${block.text}` : block.text}
          </AppText>
        ))}
        {article.sections.map((section) => (
          <View key={section.sectionId} style={{ gap: spacing.xs }}>
            <AppText variant="headingSmall">{section.heading}</AppText>
            {section.blocks.map((block, index) => (
              <AppText key={`${section.sectionId}-${index}`} variant="body">
                {block.text}
              </AppText>
            ))}
          </View>
        ))}
      </View>
      <AppText variant="caption" color="secondary">
        {assistantStrings.contentVersion}: {article.packId} v{article.version} · {article.language}
      </AppText>
      <AppText variant="caption" color="secondary">
        {assistantStrings.offlineStatus}
      </AppText>
      <AppButton label={assistantStrings.title} variant="secondary" onPress={goChat} />
    </AssistantFeatureShell>
  );
}
