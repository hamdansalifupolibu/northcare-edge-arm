import { StyleSheet, View } from 'react-native';

import { StartupShell } from '../../features/splash/StartupShell';
import { spacing } from '../../theme';
import { NorthCareLogo } from '../brand/NorthCareLogo';
import { AppText } from '../text/AppText';
import { AppActivityIndicator } from './AppActivityIndicator';

export type LoadingStateProps = {
  readonly message?: string;
  readonly testID?: string;
  /** Full-screen startup presentation used before splash / during bootstrap. */
  readonly presentation?: 'inline' | 'startup';
};

/**
 * Truthful loading presentation. No fake percentages or forced delays.
 */
export function LoadingState({
  message = 'Loading…',
  testID,
  presentation = 'inline',
}: LoadingStateProps) {
  if (presentation === 'startup') {
    return (
      <StartupShell testID={testID ?? 'startup-loading'}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={message}
          style={styles.startupContent}
        >
          <NorthCareLogo variant="symbol" size="lg" testID="startup-loading-logo" />
          <AppActivityIndicator testID="startup-loading-indicator" />
          <AppText variant="body" color="secondary" align="center">
            {message}
          </AppText>
        </View>
      </StartupShell>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={styles.inline}
    >
      <AppActivityIndicator />
      <AppText variant="body" color="secondary" align="center">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.base,
  },
  startupContent: {
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },
});
