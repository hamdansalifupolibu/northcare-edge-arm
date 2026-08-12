import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import {
  borders,
  layout,
  radii,
  shadows,
  spacing,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';

export type AppCardProps = {
  readonly children: ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
  readonly elevated?: boolean;
  readonly selected?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function AppCard({
  children,
  title,
  subtitle,
  elevated = false,
  selected = false,
  style,
  testID,
}: AppCardProps) {
  const { semantic } = useThemeMode();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: semantic.surface.primary,
          borderRadius: radii.card,
          padding: layout.cardPadding,
          borderWidth: borders.widthThin,
          borderColor: selected
            ? semantic.action.primary
            : semantic.border.default,
          gap: spacing.sm,
          ...(elevated ? shadows.sm : shadows.none),
        },
        style,
      ]}
    >
      {title ? (
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {subtitle ? (
        <AppText variant="body" color="secondary">
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}
