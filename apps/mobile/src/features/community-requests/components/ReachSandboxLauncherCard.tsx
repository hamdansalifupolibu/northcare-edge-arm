import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { layout, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  REACH_DEMO_CONFIG,
  reachDemoBrowserSimulatorUrl,
} from '../config/reachDemoConfig';
import { wakeReachDemoApi } from '../demo/wakeReachDemoApi';
import { ReachUssdIcon } from './ReachCentreIcons';

type ApiWakeState = 'idle' | 'waking' | 'ready' | 'failed';

type Props = {
  readonly title: string;
  readonly sandboxBadge: string;
};

export function ReachSandboxLauncherCard({ title, sandboxBadge }: Props) {
  const t = useTranslation();
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const [apiState, setApiState] = useState<ApiWakeState>('idle');
  const [wakeSeconds, setWakeSeconds] = useState(0);

  const openUrl = useCallback(
    async (url: string) => {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert(t.reachDemo.openFailedTitle, url);
        return;
      }
      await Linking.openURL(url);
    },
    [t.reachDemo.openFailedTitle],
  );

  const wakeApi = useCallback(async () => {
    setApiState('waking');
    setWakeSeconds(0);
    const started = Date.now();
    const tick = setInterval(() => {
      setWakeSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    try {
      const result = await wakeReachDemoApi();
      setApiState(result.ok ? 'ready' : 'failed');
    } finally {
      clearInterval(tick);
    }
  }, []);

  const openSimulator = useCallback(() => {
    void openUrl(REACH_DEMO_CONFIG.atUssdSimulatorUrl);
  }, [openUrl]);

  const openRenderInBrowser = useCallback(() => {
    void openUrl(REACH_DEMO_CONFIG.hostedApiBaseUrl);
  }, [openUrl]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
        },
      ]}
      testID="reach-sandbox-launcher-card"
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: mintSurface }]}>
          <ReachUssdIcon color={themeColors.primaryDark} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
              {title}
            </AppText>
            <View style={[styles.badge, { backgroundColor: semantic.status.warningBackground }]}>
              <AppText variant="caption" color="warning" style={styles.badgeText}>
                {sandboxBadge}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="secondary">
            {t.reachDemo.honestyBanner}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
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
          onPress={openRenderInBrowser}
          testID="reach-demo-open-api-browser"
        />
        <AppButton
          label={t.reachDemo.openSimulator}
          onPress={openSimulator}
          testID="reach-demo-open-at-simulator"
        />
      </View>

      <Pressable
        accessibilityRole="text"
        accessibilityLabel={`${t.reachDemo.serviceCodeLabel}: ${REACH_DEMO_CONFIG.sandboxServiceCode}`}
        onLongPress={openSimulator}
        style={styles.codeBox}
      >
        <AppText variant="caption" color="secondary">
          {t.reachDemo.serviceCodeLabel}
        </AppText>
        <AppText variant="label" style={styles.serviceCode}>
          {REACH_DEMO_CONFIG.sandboxServiceCode}
        </AppText>
      </Pressable>

      {apiState === 'ready' ? (
        <AppText variant="caption" color="success" testID="reach-demo-api-ready">
          {t.reachDemo.apiReady}
        </AppText>
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
        label={t.reachDemo.backupSimulator}
        variant="tertiary"
        onPress={() => void openUrl(reachDemoBrowserSimulatorUrl())}
        testID="reach-demo-open-browser-simulator"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
  },
  codeBox: {
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  serviceCode: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
