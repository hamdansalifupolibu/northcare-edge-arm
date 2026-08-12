import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { radii, shadows, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';

type Props = {
  readonly title: string;
  readonly message: string;
};

export function NutritionSuccessBanner({ title, message }: Props) {
  const { colors, isDark } = useThemeMode();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.mutedSurface : colors.surface,
          borderColor: colors.success,
        },
      ]}
      testID="nutrition-success-banner"
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.successBackground }]}>
        <AppText variant="headingSmall" style={[styles.check, { color: colors.success }]}>
          ✓
        </AppText>
      </View>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText variant="label" style={[styles.title, { color: colors.success }]}>
          {title}
        </AppText>
        <AppText variant="body" color="secondary">
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1,
    ...shadows.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontWeight: '800',
  },
  title: {
    fontWeight: '800',
  },
});
