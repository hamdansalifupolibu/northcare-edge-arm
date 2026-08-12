import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardBottomInset } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { AskSendIcon } from './AskNorthCareChatIcons';

/** Extra lift above the system inset so the composer isn’t flush with the home/nav edge. */
const COMPOSER_BOTTOM_BREATHING_ROOM = spacing.base;

type ChatInputProps = {
  readonly onSend: (text: string) => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly testID?: string;
};

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a health question…',
  testID,
}: ChatInputProps) {
  const { colors } = useThemeMode();
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const androidKeyboardLift = Platform.OS === 'android' ? keyboardInset : 0;
  const bottomPadding =
    androidKeyboardLift > 0
      ? spacing.sm + COMPOSER_BOTTOM_BREATHING_ROOM
      : Math.max(insets.bottom, spacing.sm) + COMPOSER_BOTTOM_BREATHING_ROOM;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          marginBottom: androidKeyboardLift,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
      testID={testID}
    >
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.disabled}
          editable={!disabled}
          multiline
          maxLength={500}
          returnKeyType="default"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          accessibilityLabel="Message input"
          accessibilityHint="Type your health question here"
          testID={testID ? `${testID}-input` : undefined}
        />
        <Pressable
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? colors.primary : colors.disabledBackground },
          ]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          testID={testID ? `${testID}-send` : undefined}
          hitSlop={8}
        >
          <AskSendIcon color={canSend ? colors.textInverse : colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
