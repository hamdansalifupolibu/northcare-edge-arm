import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { en } from '../../i18n/en';
import { spacing } from '../../theme';
import { IconButton } from '../buttons/IconButton';
import { AppText } from '../text/AppText';
import { AppTextInput, type AppTextInputProps } from './AppTextInput';

export type PasswordFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly required?: boolean;
  readonly testID?: string;
  readonly autoComplete?: AppTextInputProps['autoComplete'];
  readonly textContentType?: AppTextInputProps['textContentType'];
  readonly onFocus?: AppTextInputProps['onFocus'];
  readonly onBlur?: AppTextInputProps['onBlur'];
};

/**
 * Ordinary password field with accessible show/hide.
 * Hidden by default. Visibility resets when the screen loses focus.
 * PIN entry remains a separate control and must not use this component.
 * Never logs the password value.
 */
export function PasswordField({
  label,
  value,
  onChangeText,
  helperText,
  errorText,
  required,
  testID,
  autoComplete = 'password',
  textContentType = 'password',
  onFocus,
  onBlur,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const resetVisibility = useCallback(() => {
    setVisible(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetVisibility();
      };
    }, [resetVisibility]),
  );

  useEffect(() => {
    return () => {
      resetVisibility();
    };
  }, [resetVisibility]);

  const toggleLabel = visible ? en.auth.hidePassword : en.auth.showPassword;

  return (
    <View style={styles.root} testID={testID ? `${testID}-container` : undefined}>
      <View style={styles.row}>
        <View style={styles.input}>
          <AppTextInput
            label={label}
            value={value}
            onChangeText={onChangeText}
            helperText={helperText}
            errorText={errorText}
            required={required}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={autoComplete}
            textContentType={textContentType}
            testID={testID}
            containerStyle={styles.inputContainer}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </View>
        <IconButton
          accessibilityLabel={toggleLabel}
          accessibilityHint={toggleLabel}
          onPress={() => setVisible((current) => !current)}
          testID={testID ? `${testID}-visibility` : 'password-visibility'}
          style={styles.toggle}
        >
          <AppText variant="label" color="secondary">
            {visible ? en.auth.hidePasswordShort : en.auth.showPasswordShort}
          </AppText>
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  input: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 0,
  },
  toggle: {
    marginTop: spacing.xl,
    minWidth: spacing['2xl'] + spacing.lg,
    paddingHorizontal: spacing.xs,
  },
});
