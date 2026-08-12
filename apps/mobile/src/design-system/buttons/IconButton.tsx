import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { layout, opacity, radii } from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';

export type IconButtonProps = {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly accessibilityHint?: string;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
};

export function IconButton({
  accessibilityLabel,
  onPress,
  children,
  disabled = false,
  accessibilityHint,
  testID,
  style,
}: IconButtonProps) {
  const { semantic } = useThemeMode();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: layout.minTouchTarget,
          height: layout.minTouchTarget,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed
            ? semantic.surface.muted
            : 'transparent',
          opacity: disabled ? opacity.disabled : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
