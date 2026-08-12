import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { radii, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';

type Stat = {
  readonly label: string;
  readonly value: number;
  readonly tone?: 'default' | 'danger' | 'warning' | 'success';
};

type Props = {
  readonly stats: readonly Stat[];
};

export function NutritionStatRow({ stats }: Props) {
  const { colors, isDark } = useThemeMode();

  const toneColor = (tone: Stat['tone']): string => {
    switch (tone) {
      case 'danger':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'success':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.row} testID="nutrition-stat-row">
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[
            styles.tile,
            {
              backgroundColor: isDark ? colors.mutedSurface : colors.surface,
              borderColor: colors.border,
              borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <AppText variant="headingSmall" style={{ color: toneColor(stat.tone), fontWeight: '800' }}>
            {stat.value}
          </AppText>
          <AppText variant="caption" color="secondary" style={styles.label}>
            {stat.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xxs,
    elevation: 1,
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
});
