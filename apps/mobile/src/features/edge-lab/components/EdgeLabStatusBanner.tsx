import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export type EdgeLabBannerTone = 'ready' | 'blocked' | 'running' | 'info' | 'success' | 'warning';

type EdgeLabStatusBannerProps = {
  readonly tone: EdgeLabBannerTone;
  readonly title: string;
  readonly detail?: string;
  readonly testID?: string;
};

export function EdgeLabStatusBanner({ tone, title, detail, testID }: EdgeLabStatusBannerProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  const palette = (() => {
    switch (tone) {
      case 'ready':
      case 'success':
        return {
          background: themeColors.successBackground,
          border: themeColors.success,
          titleColor: 'primary' as const,
        };
      case 'blocked':
        return {
          background: themeColors.dangerBackground,
          border: themeColors.danger,
          titleColor: 'primary' as const,
        };
      case 'warning':
      case 'running':
        return {
          background: themeColors.warningBackground,
          border: themeColors.warning,
          titleColor: 'primary' as const,
        };
      case 'info':
      default:
        return {
          background: semantic.surface.muted,
          border: semantic.border.default,
          titleColor: 'primary' as const,
        };
    }
  })();

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: palette.background,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <AppText variant="label" color={palette.titleColor}>
        {title}
      </AppText>
      {detail ? (
        <AppText variant="caption" color="secondary">
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}
