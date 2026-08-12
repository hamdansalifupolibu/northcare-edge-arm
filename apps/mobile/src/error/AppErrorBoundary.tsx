import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Logger } from '../logging/logger';
import { colors, semanticColors } from '../theme';

type Props = {
  readonly children: ReactNode;
  readonly logger: Logger;
  readonly diagnosticsEnabled: boolean;
  readonly onRetry?: () => void;
};

type State = {
  hasError: boolean;
  diagnosticVisible: boolean;
  errorName: string;
};

/**
 * Application-level error boundary.
 * Shows a calm generic message; stack traces stay development-only.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    diagnosticVisible: false,
    errorName: '',
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorName: error.name || 'Error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.logger.error('Unhandled render error', {
      name: error.name,
      message: error.message.slice(0, 200),
      componentStackLength: info.componentStack?.length ?? 0,
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, diagnosticVisible: false, errorName: '' });
    this.props.onRetry?.();
  };

  private toggleDiagnostics = (): void => {
    if (!this.props.diagnosticsEnabled) {
      return;
    }
    this.setState((prev) => ({ diagnosticVisible: !prev.diagnosticVisible }));
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container} accessibilityRole="alert">
        <Text style={styles.title}>NorthCare AI encountered an unexpected problem.</Text>
        <Text style={styles.body}>
          Your saved information has not been intentionally removed. Restart the app or try
          again.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={this.handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>

        {this.props.diagnosticsEnabled ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={this.toggleDiagnostics}
            accessibilityRole="button"
            accessibilityLabel="Toggle development diagnostics"
          >
            <Text style={styles.secondaryButtonText}>
              {this.state.diagnosticVisible ? 'Hide diagnostics' : 'Show diagnostics'}
            </Text>
          </Pressable>
        ) : null}

        {this.props.diagnosticsEnabled && this.state.diagnosticVisible ? (
          <Text style={styles.diagnostic}>
            Development diagnostic: {this.state.errorName}. Stack traces are not shown to end
            users.
          </Text>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.background.primary,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: semanticColors.text.primary,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: semanticColors.text.secondary,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: semanticColors.action.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: semanticColors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '500',
  },
  diagnostic: {
    marginTop: 16,
    padding: 12,
    backgroundColor: semanticColors.status.urgentBackground,
    color: semanticColors.status.urgent,
    fontSize: 13,
    lineHeight: 18,
    borderRadius: 8,
  },
});
