import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import {
  REACH_DEMO_CONFIG,
  reachDemoBrowserSimulatorUrl,
} from '../config/reachDemoConfig';
import { wakeReachDemoApi } from '../demo/wakeReachDemoApi';

type ApiWakeState = 'idle' | 'waking' | 'ready' | 'failed';

type Props = {
  readonly compact?: boolean;
};

export function ReachUssdDemoLauncher({ compact = false }: Props) {
  const t = useTranslation();
  const [apiState, setApiState] = useState<ApiWakeState>('idle');
  const [wakeSeconds, setWakeSeconds] = useState(0);

  const openUrl = useCallback(async (url: string) => {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert(t.reachDemo.openFailedTitle, url);
      return;
    }
    await Linking.openURL(url);
  }, [t.reachDemo.openFailedTitle]);

  const wakeApi = useCallback(async () => {
    setApiState('waking');
    setWakeSeconds(0);
    const started = Date.now();
    const tick = setInterval(() => {
      setWakeSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    try {
      const result = await wakeReachDemoApi();
      if (result.ok) {
        setApiState('ready');
      } else {
        setApiState('failed');
      }
    } finally {
      clearInterval(tick);
    }
  }, []);

  const openSimulator = useCallback(() => {
    if (apiState !== 'ready') {
      Alert.alert(
        t.reachDemo.cautionTitle,
        t.reachDemo.cautionBody,
        [
          { text: t.reachDemo.wakeApi, onPress: () => void wakeApi() },
          {
            text: t.reachDemo.openSimulatorAnyway,
            style: 'destructive',
            onPress: () => void openUrl(REACH_DEMO_CONFIG.atUssdSimulatorUrl),
          },
          { text: t.communityRequests.cancelAction, style: 'cancel' },
        ],
      );
      return;
    }
    void openUrl(REACH_DEMO_CONFIG.atUssdSimulatorUrl);
  }, [apiState, openUrl, t, wakeApi]);

  return (
    <View
      style={[styles.card, compact && styles.cardCompact]}
      testID="reach-ussd-demo-launcher"
    >
      <AppText variant="label">{t.reachDemo.title}</AppText>
      <View style={styles.banner}>
        <AppText variant="caption" style={styles.bannerText}>
          {t.reachDemo.honestyBanner}
        </AppText>
      </View>

      <View style={styles.cautionBox}>
        <AppText variant="caption" style={styles.cautionTitle}>
          {t.reachDemo.cautionTitle}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.reachDemo.cautionBody}
        </AppText>
      </View>

      {apiState === 'ready' ? (
        <View style={styles.readyBox} testID="reach-demo-api-ready">
          <AppText variant="caption" style={styles.readyText}>
            {t.reachDemo.apiReady}
          </AppText>
        </View>
      ) : null}

      {apiState === 'failed' ? (
        <AppText variant="caption" color="urgent" testID="reach-demo-api-failed">
          {t.reachDemo.apiWakeFailed}
        </AppText>
      ) : null}

      {apiState === 'waking' ? (
        <AppText variant="caption" color="secondary">
          {t.reachDemo.wakingApi(wakeSeconds)}
        </AppText>
      ) : null}

      <AppButton
        label={apiState === 'waking' ? t.reachDemo.wakingApiShort : t.reachDemo.wakeApi}
        variant="secondary"
        disabled={apiState === 'waking'}
        onPress={() => void wakeApi()}
        testID="reach-demo-wake-api"
      />

      <AppButton
        label={t.reachDemo.openApiInBrowser}
        variant="tertiary"
        onPress={() => void openUrl(REACH_DEMO_CONFIG.hostedApiBaseUrl)}
        testID="reach-demo-open-api-browser"
      />

      <View style={styles.codeBox}>
        <AppText variant="caption" color="secondary">
          {t.reachDemo.serviceCodeLabel}
        </AppText>
        <Pressable
          accessibilityRole="text"
          onLongPress={() => void openUrl(REACH_DEMO_CONFIG.atUssdSimulatorUrl)}
        >
          <AppText variant="label" style={styles.serviceCode}>
            {REACH_DEMO_CONFIG.sandboxServiceCode}
          </AppText>
        </Pressable>
        <AppText variant="caption" color="secondary">
          {t.reachDemo.simulatorStepHint}
        </AppText>
      </View>

      <AppButton
        label={t.reachDemo.openSimulator}
        disabled={apiState === 'waking'}
        onPress={openSimulator}
        testID="reach-demo-open-at-simulator"
      />

      {!compact ? (
        <AppButton
          label={t.reachDemo.backupSimulator}
          variant="tertiary"
          onPress={() => void openUrl(reachDemoBrowserSimulatorUrl())}
          testID="reach-demo-open-browser-simulator"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompact: {
    padding: spacing.sm,
  },
  banner: {
    backgroundColor: colors.warningBackground,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.warning,
    fontWeight: '600',
  },
  cautionBox: {
    backgroundColor: colors.mutedSurface,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cautionTitle: {
    fontWeight: '700',
  },
  readyBox: {
    backgroundColor: colors.successBackground,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  readyText: {
    color: colors.success,
    fontWeight: '600',
  },
  codeBox: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  serviceCode: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
