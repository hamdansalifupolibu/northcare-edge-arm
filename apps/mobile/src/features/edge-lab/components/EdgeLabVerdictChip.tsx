import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { EdgeExperimentVerdict } from '../domain/types';

type EdgeLabVerdictChipProps = {
  readonly verdict: EdgeExperimentVerdict | 'promoted';
};

export function EdgeLabVerdictChip({ verdict }: EdgeLabVerdictChipProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  const palette = (() => {
    switch (verdict) {
      case 'accepted':
      case 'promoted':
        return {
          background: themeColors.successBackground,
          border: themeColors.success,
          // "Shipped" = accepted in lab and turned on in the real app (clearer than "promoted").
          label: verdict === 'promoted' ? 'SHIPPED' : 'ACCEPTED',
        };
      case 'rejected':
        return {
          background: themeColors.dangerBackground,
          border: themeColors.danger,
          label: 'REJECTED',
        };
      case 'pending':
        return {
          background: semantic.status.warningBackground,
          border: themeColors.warning,
          label: 'PENDING',
        };
      default:
        return {
          background: semantic.surface.muted,
          border: semantic.border.default,
          label: verdict.toUpperCase(),
        };
    }
  })();

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.pill,
        backgroundColor: palette.background,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <AppText variant="caption" color="primary">
        {palette.label}
      </AppText>
    </View>
  );
}
