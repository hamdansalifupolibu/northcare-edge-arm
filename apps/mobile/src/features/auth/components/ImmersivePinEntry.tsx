import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { layout, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export type ImmersivePinEntryProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly accessibilityLabel: string;
  readonly testID?: string;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly hasError?: boolean;
};

/**
 * Six-digit PIN entry with circular slots for the immersive unlock sheet.
 * Tapping anywhere on the row focuses the hidden input and opens the keyboard.
 */
export function ImmersivePinEntry({
  value,
  onChange,
  accessibilityLabel,
  testID,
  disabled = false,
  autoFocus = true,
  hasError = false,
}: ImmersivePinEntryProps) {
  const { colors, isDark } = useThemeMode();
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const activeIndex = Math.min(value.length, 5);

  useEffect(() => {
    if (!hasError) {
      return;
    }
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [hasError, shakeAnim]);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, Platform.OS === 'android' ? 400 : 250);
    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <Pressable
      onPress={focusInput}
      style={styles.root}
      testID={testID}
      accessibilityRole="none"
    >
      <Animated.View
        style={[styles.slots, { transform: [{ translateX: shakeAnim }] }]}
        accessible
        accessibilityLabel={`${accessibilityLabel}. ${Math.min(value.length, 6)} of 6 digits entered.`}
        accessibilityRole="text"
      >
        {Array.from({ length: 6 }, (_, index) => {
          const filled = index < value.length;
          const isActive = !disabled && index === activeIndex;
          return (
            <View
              key={`immersive-pin-slot-${index}`}
              style={[
                styles.slot,
                {
                  borderColor: hasError
                    ? colors.danger
                    : filled || isActive
                      ? colors.primary
                      : isDark
                        ? colors.border
                        : '#B8D9D4',
                  backgroundColor: hasError
                    ? colors.dangerBackground
                    : filled
                      ? isDark
                        ? colors.mutedSurface
                        : '#F0FAF8'
                      : isDark
                        ? colors.mutedSurface
                        : colors.surface,
                  borderWidth: isActive ? 2.5 : 2,
                  shadowColor: isActive ? colors.primary : 'transparent',
                  shadowOpacity: isActive ? 0.25 : 0,
                  shadowRadius: isActive ? 6 : 0,
                  elevation: isActive ? 2 : 0,
                },
              ]}
            >
              {filled ? (
                <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
              ) : null}
            </View>
          );
        })}
      </Animated.View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
        secureTextEntry
        caretHidden
        editable={!disabled}
        autoFocus={autoFocus}
        showSoftInputOnFocus
        importantForAutofill="no"
        autoComplete="off"
        textContentType="oneTimeCode"
        style={styles.hiddenInput}
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-input` : undefined}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    minHeight: layout.minTouchTarget + spacing.md,
    justifyContent: 'center',
  },
  slots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slot: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: '50%',
    left: '50%',
  },
});
