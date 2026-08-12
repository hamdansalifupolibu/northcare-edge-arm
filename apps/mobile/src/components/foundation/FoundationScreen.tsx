import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { AppConfig } from '../../config/appConfig';
import { APP_METADATA } from '../../constants/metadata';
import {
  AppButton,
  AppText,
  Divider,
  NorthCareLogo,
  ScrollableAppScreen,
} from '../../design-system';
import { semanticColors, spacing } from '../../theme';

type Props = {
  readonly config: AppConfig;
  readonly assetStatus: 'loaded' | 'missing';
  readonly loggerStatus: 'ready';
  readonly errorBoundaryStatus: 'active';
  readonly onOpenDesignPreview?: () => void;
};

/**
 * Development foundation status screen.
 * Not a clinical dashboard — no fake health data.
 */
export function FoundationScreen({
  config,
  assetStatus,
  loggerStatus,
  errorBoundaryStatus,
  onOpenDesignPreview,
}: Props) {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Controlled development error-boundary verification');
  }

  return (
    <ScrollableAppScreen>
      <View style={styles.content}>
        <NorthCareLogo size="lg" />

        <AppText variant="headingLarge" align="center" style={styles.productName}>
          {APP_METADATA.productName}
        </AppText>
        <AppText variant="bodyLarge" color="secondary" align="center">
          {APP_METADATA.tagline}
        </AppText>

        <AppText variant="title" align="center" style={styles.sectionTitle}>
          Development Foundation
        </AppText>
        <AppText variant="body" color="secondary" align="center" style={styles.body}>
          Android application environment is ready.
        </AppText>

        <View style={styles.statusBlock}>
          <StatusRow label="Environment" value={config.appEnv} />
          <StatusRow
            label="Platform"
            value={Platform.OS === 'android' ? 'Android' : Platform.OS}
          />
          <StatusRow label="Status" value="Foundation verified" />
          <StatusRow label="App version" value={config.appVersion} />
          <StatusRow label="Build type" value={config.buildType} />
          <StatusRow label="Asset loading" value={assetStatus} />
          <StatusRow label="Error boundary" value={errorBoundaryStatus} />
          <StatusRow label="Logger" value={loggerStatus} />
          <StatusRow
            label="Android package"
            value={
              config.androidPackageProvisional
                ? `${config.androidPackage} (PROVISIONAL)`
                : config.androidPackage
            }
          />
        </View>

        {onOpenDesignPreview ? (
          <AppButton
            label="Open design system preview"
            onPress={onOpenDesignPreview}
            variant="secondary"
            style={styles.devButton}
            accessibilityHint="Development only gallery of design tokens and components"
          />
        ) : null}

        {config.diagnosticsEnabled ? (
          <AppButton
            label="Verify error boundary (dev only)"
            onPress={() => setShouldCrash(true)}
            variant="tertiary"
            style={styles.devButton}
          />
        ) : null}
      </View>
    </ScrollableAppScreen>
  );
}

function StatusRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color="secondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
      <Divider spacingSize="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  productName: {
    marginTop: spacing.base,
  },
  sectionTitle: {
    marginTop: spacing.xl,
  },
  body: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusBlock: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semanticColors.border.default,
    paddingTop: spacing.sm,
  },
  row: {
    paddingVertical: spacing.sm,
  },
  devButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
