import { View } from 'react-native';

import {
  AppText,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { listLoadableTemplates } from '../../screening/content/registry';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';

/** Development-only template preview. Production layout redirects away. */
export function ScreeningTemplatePreviewScreen() {
  const templates = listLoadableTemplates();

  return (
    <ScrollableAppScreen testID="screening-template-preview">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.visits.preview.title}</ScreenTitle>
        <AppText variant="body">{t.visits.preview.body}</AppText>
        {templates.length === 0 ? (
          <AppText variant="body" color="secondary">
            {t.visits.preview.empty}
          </AppText>
        ) : null}
        {templates.map((template) => (
          <View key={`${template.templateId}@${template.version}`} style={{ gap: spacing.sm }}>
            <AppText variant="headingSmall">
              {template.title} (v{template.version})
            </AppText>
            <AppText variant="caption" color="warning">
              {template.developmentBanner}
            </AppText>
            <AppText variant="caption" color="secondary">
              {template.status} · {template.templateId}
            </AppText>
            {template.sections.map((section, index) => (
              <AppText key={section.id} variant="caption" color="secondary">
                Section {index + 1}: {section.title} ({section.questions.length} items)
              </AppText>
            ))}
          </View>
        ))}
      </View>
    </ScrollableAppScreen>
  );
}
