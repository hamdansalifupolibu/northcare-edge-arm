import type { ReactNode } from 'react';
import { View } from 'react-native';

import { layout, spacing } from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';
import { BackButton } from './BackButton';

export type AppHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly rightAction?: ReactNode;
  readonly testID?: string;
};

export function AppHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  testID,
}: AppHeaderProps) {
  const { semantic } = useThemeMode();

  return (
    <View
      testID={testID}
      style={{
        minHeight: layout.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: semantic.border.default,
        marginBottom: spacing.base,
      }}
    >
      {onBack ? <BackButton onPress={onBack} /> : null}
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText variant="title" accessibilityRole="header" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {rightAction}
    </View>
  );
}
