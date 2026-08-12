import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useThemeMode } from './ThemeModeProvider';

type NamedStyles<T> = {
  readonly [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Build a StyleSheet that reacts to light/dark theme changes.
 */
export function useThemeStyles<T extends NamedStyles<T>>(
  factory: (theme: ReturnType<typeof useThemeMode>) => T,
): T {
  const theme = useThemeMode();
  return useMemo(
    () => StyleSheet.create(factory(theme)),
    [factory, theme.colors, theme.isDark, theme.mode, theme.semantic],
  );
}
