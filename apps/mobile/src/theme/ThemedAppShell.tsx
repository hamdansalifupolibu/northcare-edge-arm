import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useThemeMode } from './ThemeModeProvider';

export function ThemedAppShell({ children }: { readonly children: ReactNode }) {
  const { semantic, isDark } = useThemeMode();

  return (
    <View style={[styles.root, { backgroundColor: semantic.background.primary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
