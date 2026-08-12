import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { layout, radii, semanticColors, spacing } from '../../../theme';

export type PinEntryProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly accessibilityLabel: string;
  readonly testID?: string;
};

/**
 * Six-digit PIN entry. Digits are not announced individually.
 */
export function PinEntry({ value, onChange, accessibilityLabel, testID }: PinEntryProps) {
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  return (
    <View style={styles.root} testID={testID}>
      <View
        style={styles.slots}
        accessible
        accessibilityLabel={`${accessibilityLabel}. ${Math.min(value.length, 6)} of 6 digits entered.`}
        accessibilityRole="text"
      >
        {digits.map((digit, index) => (
          <View key={`pin-slot-${index}`} style={styles.slot}>
            <AppText variant="headingMedium" align="center">
              {digit.trim() === '' ? '•' : '●'}
            </AppText>
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-input` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  slots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  slot: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: semanticColors.border.default,
    backgroundColor: semanticColors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
  },
});
