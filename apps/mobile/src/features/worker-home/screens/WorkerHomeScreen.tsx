import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../design-system/text/AppText';
import { TranslationReviewBanner } from '../../../i18n/TranslationReviewBanner';
import { useTranslation } from '../../../i18n/LanguageProvider';
import {
  loginBackgroundLayout,
  resolveLoginBackgroundImageStyle,
} from '../../auth/content/loginBackgrounds';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { firstDisplayName, resolveDayPeriod } from '../domain/workerGreeting';
import { useConnectivity } from '../hooks/useConnectivity';
import { useWorkerHealthTip } from '../hooks/useWorkerHealthTip';
import { useWorkerHomeSummary } from '../hooks/useWorkerHomeSummary';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../domain/workerNav';
import { WorkerHomeAttentionSection } from '../components/WorkerHomeAttentionSection';
import { WorkerHomeHealthTipCard } from '../components/WorkerHomeHealthTipCard';
import { WorkerHomeMenuSheet } from '../components/WorkerHomeMenuSheet';
import { WorkerHomeQuickActions } from '../components/WorkerHomeQuickActions';
import { WorkerHomeTodayStats } from '../components/WorkerHomeTodayStats';
import { WorkerHomeTopBar } from '../components/WorkerHomeTopBar';

const HERO_HEIGHT_RATIO = 0.38;
const SHEET_OVERLAP = 28;
const TOP_BAR_HEIGHT = 56;

export function WorkerHomeScreen() {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { colors, isDark } = useThemeMode();
  const { session, lock, touchActivity, switchWorkspace } = useAuthSession();
  const { isOnline, checking } = useConnectivity();
  const { summary } = useWorkerHomeSummary();
  const healthTip = useWorkerHealthTip();
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const heroHeight = windowHeight * HERO_HEIGHT_RATIO;
  const topBarOffset = insets.top + spacing.sm;
  const backgroundConfig = loginBackgroundLayout.worker;
  const greetingPeriod = resolveDayPeriod(new Date());
  const firstName = session ? firstDisplayName(session.displayName) : t.workerHome.defaultName;
  const greeting = t.workerHome.greeting(greetingPeriod, firstName);
  const offlineMessage = isOnline ? t.workerHome.onlineMessage : t.workerHome.offlineMessage;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="worker-home">
      <StatusBar style="light" />

      <View style={[styles.hero, { height: heroHeight + insets.top, backgroundColor: colors.primaryDarker }]}>
        <Image
          source={backgroundConfig.source}
          style={[
            StyleSheet.absoluteFillObject,
            resolveLoginBackgroundImageStyle('worker', windowHeight, windowWidth),
          ]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <AppLinearGradient
          colors={['rgba(6,78,73,0.15)', 'rgba(6,78,73,0.55)', 'rgba(6,78,73,0.82)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={[
            styles.heroContent,
            { paddingTop: topBarOffset + TOP_BAR_HEIGHT + spacing.md, paddingBottom: spacing['3xl'] },
          ]}
        >
          <View style={styles.greetingBlock}>
            <AppText variant="headingLarge" color="inverse" style={styles.greeting}>
              {greeting}
            </AppText>
            <AppText variant="bodyLarge" style={styles.greetingHint}>
              {offlineMessage}
            </AppText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing['4xl'] + insets.bottom + WORKER_BOTTOM_NAV_CLEARANCE },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.sheet,
            {
              marginTop: heroHeight + insets.top - SHEET_OVERLAP,
              backgroundColor: isDark ? colors.background : colors.surface,
              borderColor: isDark ? colors.border : 'transparent',
              borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <TranslationReviewBanner />
          <WorkerHomeQuickActions />
          <WorkerHomeAttentionSection summary={summary} />
          <WorkerHomeTodayStats stats={summary.today} loading={summary.loading} />
          <WorkerHomeHealthTipCard tip={healthTip.text} />
        </View>
      </ScrollView>

      <View
        style={[styles.topBarOverlay, { paddingTop: topBarOffset, paddingHorizontal: spacing.lg }]}
        pointerEvents="box-none"
      >
        <WorkerHomeTopBar
          isOnline={isOnline}
          checking={checking}
          onMenuPress={() => setMenuVisible(true)}
        />
      </View>

      <WorkerHomeMenuSheet
        visible={menuVisible}
        canSwitchWorkspace={Boolean(session && session.permittedWorkspaces.length > 1)}
        isOnline={isOnline}
        checking={checking}
        roleLabel={t.auth.unlockWorkerRole}
        onClose={() => setMenuVisible(false)}
        onLock={() => {
          setMenuVisible(false);
          void lock().then(() => router.replace('/(auth)/unlock'));
        }}
        onSignOut={() => {
          setMenuVisible(false);
          router.push('/(auth)/logout-confirm');
        }}
        onSwitchWorkspace={() => {
          setMenuVisible(false);
          void switchWorkspace('administration').then((result) => {
            if (result.ok) {
              router.replace('/(admin)');
            }
          });
        }}
        onOpenSync={() => {
          setMenuVisible(false);
          router.push('/(worker)/sync-centre');
        }}
        onOpenReminders={() => {
          setMenuVisible(false);
          router.push('/(worker)/more/reminders' as Href);
        }}
        onOpenSettings={() => {
          setMenuVisible(false);
          router.push('/(worker)/more/settings' as Href);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
  },
  greetingBlock: {
    gap: spacing.xs,
    maxWidth: '88%',
  },
  greeting: {
    fontWeight: '800',
  },
  greetingHint: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
  },
  topBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
    minHeight: 420,
    ...shadows.md,
  },
});
