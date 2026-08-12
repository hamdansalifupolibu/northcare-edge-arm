import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { semanticColors, spacing } from '../../theme';
import { SplashFloatingIcons } from './SplashFloatingIcons';

export type StartupShellProps = {
  readonly children: ReactNode;
  readonly testID?: string;
};

/**
 * Shared full-screen startup canvas — white surface so the brand mark stays readable.
 */
export function StartupShell({ children, testID = 'startup-shell' }: StartupShellProps) {
  return (
    <View style={styles.root} testID={testID}>
      <StatusBar style="dark" />
      <SplashFloatingIcons />
      <View style={styles.content}>{children}</View>
      <View style={styles.accentBar} accessibilityElementsHidden importantForAccessibility="no" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semanticColors.surface.primary,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: semanticColors.action.accent,
    opacity: 0.9,
  },
});
