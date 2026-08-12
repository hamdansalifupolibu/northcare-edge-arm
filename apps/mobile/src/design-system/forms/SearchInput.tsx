import { TextInput, View, type TextInputProps } from 'react-native';

import {
  borders,
  layout,
  radii,
  spacing,
  typography,
} from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { AppText } from '../text/AppText';

export type SearchInputProps = Omit<TextInputProps, 'style'> & {
  readonly label?: string;
  readonly testID?: string;
};

export function SearchInput({
  label = 'Search',
  testID,
  ...rest
}: SearchInputProps) {
  const { semantic } = useThemeMode();

  return (
    <View testID={testID} style={{ gap: spacing.xs }}>
      <AppText variant="label" color="secondary">
        {label}
      </AppText>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        accessibilityRole="search"
        placeholderTextColor={semantic.text.disabled}
        style={{
          minHeight: layout.minTouchTarget,
          borderWidth: borders.widthThin,
          borderColor: semantic.border.default,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.base,
          backgroundColor: semantic.surface.primary,
          color: semantic.text.primary,
          fontFamily: typography.styles.bodyLarge.fontFamily,
          fontSize: typography.styles.bodyLarge.fontSize,
        }}
      />
    </View>
  );
}
