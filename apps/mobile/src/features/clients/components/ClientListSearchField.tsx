import { TextInput, View } from 'react-native';

import { borders, layout, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ClientListSearchIcon } from './ClientListIcons';

type Props = {
  readonly value: string;
  readonly placeholder: string;
  readonly onChangeText: (value: string) => void;
  readonly testID?: string;
};

export function ClientListSearchField({ value, placeholder, onChangeText, testID }: Props) {
  const { colors } = useThemeMode();

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: layout.minTouchTarget,
        borderWidth: borders.widthThin,
        borderColor: colors.border,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        gap: spacing.sm,
      }}
    >
      <ClientListSearchIcon color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          flex: 1,
          color: colors.textPrimary,
          fontSize: 16,
          paddingVertical: spacing.sm,
        }}
      />
    </View>
  );
}
