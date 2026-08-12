import { useId, useState } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import {
  borders,
  layout,
  radii,
  spacing,
  typography,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { FormErrorText } from './FormErrorText';
import { FormHelperText } from './FormHelperText';
import { FormLabel } from './FormLabel';

export type AppTextInputProps = Omit<TextInputProps, 'style'> & {
  readonly label: string;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly required?: boolean;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function AppTextInput({
  label,
  helperText,
  errorText,
  required = false,
  editable = true,
  containerStyle,
  testID,
  onFocus,
  onBlur,
  ...rest
}: AppTextInputProps) {
  const { semantic, isDark } = useThemeMode();
  const generatedId = useId();
  const labelId = `label-${generatedId}`;
  const errorId = `error-${generatedId}`;
  const helperId = `helper-${generatedId}`;
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);
  const disabled = editable === false;
  const fieldBackground = disabled
    ? semantic.action.disabledBackground
    : isDark
      ? semantic.surface.muted
      : semantic.surface.primary;

  return (
    <View
      testID={testID}
      style={[{ gap: spacing.xs, marginBottom: layout.formFieldSpacing }, containerStyle]}
    >
      <FormLabel required={required} disabled={disabled} nativeID={labelId}>
        {label}
      </FormLabel>
      <TextInput
        {...rest}
        editable={editable}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        // RN TextInput typings omit described-by; hint associates error/helper for TalkBack.
        accessibilityHint={hasError ? errorText : helperText}
        placeholderTextColor={semantic.text.disabled}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={{
          minHeight: layout.minTouchTarget,
          borderWidth: borders.widthThin,
          borderColor: hasError
            ? semantic.status.urgent
            : focused
              ? semantic.action.primary
              : semantic.border.default,
          borderRadius: radii.input,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          backgroundColor: fieldBackground,
          color: disabled
            ? semantic.text.disabled
            : semantic.text.primary,
          fontFamily: typography.styles.bodyLarge.fontFamily,
          fontSize: typography.styles.bodyLarge.fontSize,
          lineHeight: typography.styles.bodyLarge.lineHeight,
        }}
      />
      {hasError ? (
        <FormErrorText testID={testID ? `${testID}-error` : undefined} nativeID={errorId}>
          {errorText!}
        </FormErrorText>
      ) : null}
      {!hasError && helperText ? (
        <FormHelperText nativeID={helperId}>{helperText}</FormHelperText>
      ) : null}
    </View>
  );
}
