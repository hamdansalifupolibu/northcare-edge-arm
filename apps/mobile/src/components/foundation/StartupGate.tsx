import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '../../design-system';
import type { Logger } from '../../logging/logger';
import { semanticColors, spacing } from '../../theme';

type Props = {
  readonly logger: Logger;
  readonly children: ReactNode;
  /** When false, keep showing preparing until fonts / foundation ready */
  readonly ready?: boolean;
};

type StartupPhase = 'preparing' | 'ready' | 'failed';

/**
 * Minimal startup gate for foundation checks only.
 * SQLite initialisation is owned by DatabaseProvider + LaunchProvider.
 */
export function StartupGate({ logger, children, ready = true }: Props) {
  const [phase, setPhase] = useState<StartupPhase>('preparing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runFoundationChecks(): Promise<void> {
      try {
        logger.info('Starting foundation checks');

        // Asset presence check via require (Metro resolves at bundle time)
        require('../../../assets/brand/northcare-logo-symbol-primary.png');

        if (cancelled) {
          return;
        }

        logger.info('Foundation checks complete');
        setPhase('ready');
      } catch (error) {
        const message =
          error instanceof Error ? error.message.slice(0, 200) : 'Unknown startup error';
        logger.error('Foundation startup failed', { message });
        if (!cancelled) {
          setErrorMessage(message);
          setPhase('failed');
        }
      }
    }

    void runFoundationChecks();

    return () => {
      cancelled = true;
    };
    // Foundation checks run once at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'ready' && ready) {
    return <>{children}</>;
  }

  if (phase === 'failed') {
    return (
      <View style={styles.container}>
        <AppText variant="headingSmall" align="center">
          NorthCare AI could not finish preparing.
        </AppText>
        <AppText variant="body" color="secondary" align="center" style={styles.body}>
          Restart the app. If the problem continues, check the development environment
          configuration.
        </AppText>
        {errorMessage ? (
          <AppText variant="caption" color="urgent" align="center" style={styles.detail}>
            {errorMessage}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={semanticColors.action.primary} />
      <AppText variant="bodyLarge" color="secondary" style={styles.preparing}>
        Preparing NorthCare AI…
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  preparing: {
    marginTop: spacing.base,
  },
  body: {
    marginTop: spacing.md,
  },
  detail: {
    marginTop: spacing.base,
  },
});
