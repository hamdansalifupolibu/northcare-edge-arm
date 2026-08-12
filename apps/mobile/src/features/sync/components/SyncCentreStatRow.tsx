import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type Stat = {
  readonly label: string;
  readonly value: number | string;
  readonly tone?: 'default' | 'danger' | 'warning' | 'success';
};

type Props = {
  readonly stats: readonly Stat[];
};

function toneColor(tone: Stat['tone']): string {
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
}

export function SyncCentreStatRow({ stats }: Props) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.row} testID="sync-centre-stat-row">
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[
            styles.tile,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
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
    flexBasis: '45%',
    minWidth: 120,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  label: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
