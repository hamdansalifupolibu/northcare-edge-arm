import { Pressable, View } from 'react-native';

import {
  borders,
  layout,
  radii,
  spacing,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';

export type CheckboxFieldProps = {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  readonly disabled?: boolean;
  readonly helperText?: string;
  readonly testID?: string;
};

export function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
  helperText,
  testID,
}: CheckboxFieldProps) {
  const { semantic } = useThemeMode();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        minHeight: layout.minTouchTarget,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          marginTop: 2,
          borderRadius: radii.sm,
          borderWidth: borders.widthMedium,
          borderColor: checked
            ? semantic.action.primary
            : semantic.border.default,
          backgroundColor: checked
            ? semantic.action.primary
            : semantic.surface.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? (
          <AppText variant="label" color="inverse">
            ✓
          </AppText>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText variant="bodyLarge" color={disabled ? 'disabled' : 'primary'}>
          {label}
        </AppText>
        {helperText ? (
          <AppText variant="caption" color="secondary">
            {helperText}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
