import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { radii, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';
import { getNutritionSectionTheme } from '../../utils/nutritionSectionTheme';

type Props = {
  readonly sectionId: string;
  readonly title: string;
  readonly description?: string;
};

export function NutritionTemplateSectionHeader({ sectionId, title, description }: Props) {
  const { colors, isDark } = useThemeMode();
  const theme = getNutritionSectionTheme(sectionId, colors, isDark);

  return (
    <View
      style={[styles.card, { backgroundColor: theme.background, borderLeftColor: theme.accent }]}
      testID={`nutrition-section-header-${sectionId}`}
    >
      <View style={styles.titleRow}>
        <AppText variant="body" style={styles.icon}>
          {theme.icon}
        </AppText>
        <AppText variant="headingSmall" style={{ flex: 1, color: theme.accent }}>
          {title}
        </AppText>
      </View>
      {description ? (
        <AppText variant="body" color="secondary">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    padding: spacing.base,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
});
