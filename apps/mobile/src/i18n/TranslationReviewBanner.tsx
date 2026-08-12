import { StyleSheet, View } from 'react-native';

import { AppText } from '../design-system/text/AppText';
import { spacing } from '../theme';
import { useThemeMode } from '../theme/ThemeModeProvider';

import { DG_TRANSLATION_STATUS } from './dg';
import { useLanguage, useTranslation } from './LanguageProvider';

/**
 * Shown when Dagbanli is active to remind workers that translations are not clinically reviewed.
 */
export function TranslationReviewBanner({ testID = 'translation-review-banner' }: { testID?: string }) {
  const { language } = useLanguage();
  const t = useTranslation();
  const { semantic } = useThemeMode();

  if (language !== 'dg' || DG_TRANSLATION_STATUS.status === 'REVIEWED') {
    return null;
  }

  return (
    <View
      style={[styles.banner, { backgroundColor: semantic.status.warningBackground }]}
      testID={testID}
      accessibilityRole="text"
    >
      <AppText variant="caption" color="secondary">
        {t.language.reviewBanner}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
});
