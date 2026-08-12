import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type Props = {
  readonly title: string;
  readonly body: string;
  readonly detail?: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly tone?: 'neutral' | 'warning' | 'urgent';
};

export function HomeSummaryCard({
  title,
  body,
  detail,
  onPress,
  testID,
  tone = 'neutral',
}: Props) {
  const { colors, isDark } = useThemeMode();
  const borderColor =
    tone === 'urgent' ? colors.danger : tone === 'warning' ? colors.warning : colors.primary;
  const cardBackground = isDark ? colors.mutedSurface : colors.surface;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor: colors.border,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
          opacity: pressed ? 0.85 : 1,
          borderLeftColor: borderColor,
        },
      ]}
    >
      <AppText variant="caption" style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </AppText>
      <AppText variant="label" style={{ color: colors.textPrimary }}>
        {body}
      </AppText>
      {detail ? (
        <AppText variant="caption" color="secondary">
          {detail}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.xs,
    borderLeftWidth: 4,
    elevation: 1,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
