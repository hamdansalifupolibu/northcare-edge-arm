import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  layout,
  opacity,
  radii,
  spacing,
  type SemanticColors,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';

export type AppButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'accent';
export type AppButtonSize = 'standard' | 'compact';

export type AppButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: AppButtonVariant;
  readonly size?: AppButtonSize;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly accessibilityHint?: string;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
};

type VariantStyle = {
  readonly background: string;
  readonly pressedBackground: string;
  readonly textColor: 'inverse' | 'action' | 'urgent' | 'primary';
  readonly borderColor?: string;
};

function buttonVariants(semantic: SemanticColors): Record<AppButtonVariant, VariantStyle> {
  return {
    primary: {
      background: semantic.action.primary,
      pressedBackground: semantic.action.primaryPressed,
      textColor: 'inverse',
    },
    secondary: {
      background: semantic.surface.primary,
      pressedBackground: semantic.surface.muted,
      textColor: 'action',
      borderColor: semantic.action.primary,
    },
    tertiary: {
      background: 'transparent',
      pressedBackground: semantic.surface.muted,
      textColor: 'action',
    },
    destructive: {
      background: semantic.action.destructive,
      pressedBackground: semantic.action.primaryDarker,
      textColor: 'inverse',
    },
    accent: {
      background: semantic.action.accent,
      pressedBackground: '#D97706',
      textColor: 'inverse',
    },
  };
}

/**
 * Accessible button with 48dp minimum touch target.
 * Colour is not the sole cue for destructive — label must convey risk.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'standard',
  disabled = false,
  loading = false,
  fullWidth = true,
  leadingIcon,
  trailingIcon,
  accessibilityHint,
  testID,
  style,
}: AppButtonProps) {
  const { semantic } = useThemeMode();
  const isDisabled = disabled || loading;
  const palette = buttonVariants(semantic)[variant];
  const verticalPad = size === 'compact' ? spacing.sm : spacing.md;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        if (isDisabled) {
          return;
        }
        onPress();
      }}
      style={({ pressed }) => [
        {
          minHeight: layout.minTouchTarget,
          paddingVertical: verticalPad,
          paddingHorizontal: spacing.base,
          borderRadius: radii.button,
          backgroundColor: isDisabled
            ? semantic.action.disabledBackground
            : pressed
              ? palette.pressedBackground
              : palette.background,
          borderWidth: palette.borderColor ? 1.5 : 0,
          borderColor: isDisabled
            ? semantic.action.disabled
            : palette.borderColor,
          opacity: isDisabled ? opacity.disabled : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            palette.textColor === 'inverse'
              ? semantic.text.inverse
              : semantic.action.primary
          }
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {leadingIcon ? <View>{leadingIcon}</View> : null}
          <AppText
            variant="button"
            color={isDisabled ? 'disabled' : palette.textColor}
            align="center"
          >
            {label}
          </AppText>
          {trailingIcon ? <View>{trailingIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
