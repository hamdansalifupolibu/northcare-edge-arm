import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type EdgeLabMetricTileProps = {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly emphasize?: boolean;
};

export function EdgeLabMetricTile({
  label,
  value,
  detail,
  emphasize = false,
}: EdgeLabMetricTileProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      style={{
        flex: 1,
        minWidth: '30%',
        padding: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: emphasize ? themeColors.successBackground : semantic.surface.muted,
        borderWidth: 1,
        borderColor: emphasize ? themeColors.success : semantic.border.default,
        gap: spacing.xxs,
      }}
    >
      <AppText variant="caption" color="secondary" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="title" color="primary" numberOfLines={1}>
        {value}
      </AppText>
      {detail ? (
        <AppText variant="caption" color="secondary" numberOfLines={2}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}
