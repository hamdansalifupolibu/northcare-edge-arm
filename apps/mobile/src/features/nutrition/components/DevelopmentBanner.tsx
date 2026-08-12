import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

type Props = {
  readonly message: string;
  /** Info card styling for the start-assessment screen only. */
  readonly variant?: 'inline' | 'info';
};

export function DevelopmentBanner({ message, variant = 'inline' }: Props) {
  const nutritionStrings = useNutritionStrings();

  if (variant === 'info') {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={nutritionStrings.accessibilityDevelopmentWarning}
        style={styles.infoCard}
        testID="nutrition-development-banner"
      >
        <AppText variant="caption" color="secondary" style={styles.infoText}>
          {message}
        </AppText>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={nutritionStrings.accessibilityDevelopmentWarning}
      style={{ gap: spacing.xs }}
      testID="nutrition-development-banner"
    >
      <AppText variant="caption" color="warning">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  infoText: {
    lineHeight: 18,
    fontSize: 12,
  },
});
