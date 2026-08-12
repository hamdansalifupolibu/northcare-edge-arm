import { View, StyleSheet } from 'react-native';

import { AppButton, AppText } from '../../../../design-system';
import { radii, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';

type Props = {
  readonly title: string;
  readonly body: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
};

export function NutritionCentreEmptyState({ title, body, actionLabel, onAction }: Props) {
  const { colors, isDark } = useThemeMode();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: isDark ? colors.mutedSurface : colors.surface,
          borderColor: colors.border,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
        },
      ]}
      testID="nutrition-centre-empty"
    >
      <View style={[styles.iconWrap, { backgroundColor: isDark ? colors.surface : colors.mutedSurface }]}>
        <AppText variant="headingLarge">🥗</AppText>
      </View>
      <AppText variant="label" style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </AppText>
      <AppText variant="body" color="secondary" style={styles.body}>
        {body}
      </AppText>
      <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.xl,
    borderRadius: radii.lg,
    elevation: 1,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
  },
});
