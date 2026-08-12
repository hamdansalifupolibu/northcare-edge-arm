import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import {
  borders,
  layout,
  opacity,
  radii,
  shadows,
  spacing,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';

export type PressableCardProps = {
  readonly children?: ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly selected?: boolean;
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function PressableCard({
  children,
  title,
  subtitle,
  onPress,
  disabled = false,
  selected = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: PressableCardProps) {
  const { semantic } = useThemeMode();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: pressed
            ? semantic.surface.muted
            : selected
              ? semantic.surface.muted
              : semantic.surface.primary,
          borderRadius: radii.card,
          padding: layout.cardPadding,
          borderWidth: selected ? borders.widthMedium : borders.widthThin,
          borderColor: selected
            ? semantic.action.primary
            : semantic.border.default,
          gap: spacing.sm,
          opacity: disabled ? opacity.disabled : 1,
          minHeight: layout.minTouchTarget,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <AppText variant="title">{title}</AppText>
      {subtitle ? (
        <AppText variant="body" color="secondary">
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </Pressable>
  );
}
