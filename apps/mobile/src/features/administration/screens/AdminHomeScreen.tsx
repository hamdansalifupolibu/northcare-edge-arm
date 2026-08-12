import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  LoadingState,
  ScreenTitle,
  SearchInput,
} from '../../../design-system';
import { TranslationReviewBanner } from '../../../i18n/TranslationReviewBanner';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  loginBackgroundLayout,
  resolveLoginBackgroundImageStyle,
} from '../../auth/content/loginBackgrounds';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { firstDisplayName, resolveDayPeriod } from '../../worker-home/domain/workerGreeting';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { WorkerHubHeader } from '../../worker-home/components/WorkerHubHeader';
import { WorkerHomeMenuSheet } from '../../worker-home/components/WorkerHomeMenuSheet';
import { WorkerHomeTopBar } from '../../worker-home/components/WorkerHomeTopBar';
import { AccountListItem } from '../components/AccountListItem';
import { AdminPortalShell } from '../components/AdminPortalShell';
import { AdminHomeQuickActions } from '../components/AdminHomeQuickActions';
import { AdminHomeStats } from '../components/AdminHomeStats';
import {
  AdministrationOfflineState,
  mapAdministrationError,
} from '../components/AdministrationStateViews';
import type { AdminAccountSummary } from '../domain/types';
import { useAdministrationServices } from '../hooks/useAdministrationServices';
import { useOfflineProvisioningServices } from '../hooks/useOfflineProvisioningServices';

const ACCOUNT_LIST_PAGE_SIZE = 20;
const HERO_HEIGHT_RATIO = 0.38;
const SHEET_OVERLAP = 28;
const TOP_BAR_HEIGHT = 56;

export function AdminHomeScreen() {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { colors, isDark } = useThemeMode();
  const { session, lock, touchActivity, switchWorkspace } = useAuthSession();
  const { isOnline, checking } = useConnectivity();
  const services = useAdministrationServices();
  const [menuVisible, setMenuVisible] = useState(false);
  const [summary, setSummary] = useState<{
    workerCount: number;
    pendingFirstLoginCount: number;
    inactiveWorkerCount: number;
    syncedRecordCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const home = await services.getAdminHome();
      setSummary(home);
    } catch (error) {
      setSummary(null);
      setOffline(mapAdministrationError(error) === 'offline');
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const heroHeight = windowHeight * HERO_HEIGHT_RATIO;
  const topBarOffset = insets.top + spacing.sm;
  const backgroundConfig = loginBackgroundLayout.administrator;
  const greetingPeriod = resolveDayPeriod(new Date());
  const firstName = session
    ? firstDisplayName(session.displayName)
    : t.adminShell.defaultName;
  const greeting = t.adminShell.greeting(greetingPeriod, firstName);
  const statusMessage = isOnline ? t.adminShell.onlineMessage : t.adminShell.offlineMessage;

  if (offline && !summary) {
    return (
      <AppScreen testID="admin-home">
        <ScreenTitle>{t.adminShell.title}</ScreenTitle>
        <AdministrationOfflineState onRetry={() => void load()} />
      </AppScreen>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="admin-home">
      <StatusBar style="light" />

      <View
        style={[
          styles.hero,
          { height: heroHeight + insets.top, backgroundColor: colors.primaryDarker },
        ]}
      >
        <Image
          source={backgroundConfig.source}
          style={[
            StyleSheet.absoluteFill,
            resolveLoginBackgroundImageStyle('administrator', windowHeight, windowWidth),
          ]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <AppLinearGradient
          colors={['rgba(6,78,73,0.15)', 'rgba(6,78,73,0.55)', 'rgba(6,78,73,0.82)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.heroContent,
            {
              paddingTop: topBarOffset + TOP_BAR_HEIGHT + spacing.md,
              paddingBottom: spacing['3xl'],
            },
          ]}
        >
          <View style={styles.greetingBlock}>
            <AppText variant="headingLarge" color="inverse" style={styles.greeting}>
              {greeting}
            </AppText>
            <AppText variant="bodyLarge" style={styles.greetingHint}>
              {statusMessage}
            </AppText>
            <AppText variant="caption" style={styles.workspaceHint} testID="admin-active-workspace">
              {t.adminShell.activeWorkspace}
            </AppText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing['4xl'] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.sheet,
            {
              marginTop: heroHeight + insets.top - SHEET_OVERLAP,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: StyleSheet.hairlineWidth,
            },
          ]}
        >
          <TranslationReviewBanner />
          <AdminHomeQuickActions />
          <AdminHomeStats
            workerCount={summary?.workerCount ?? 0}
            pendingFirstLoginCount={summary?.pendingFirstLoginCount ?? 0}
            inactiveWorkerCount={summary?.inactiveWorkerCount ?? 0}
            loading={loading}
          />
          {typeof summary?.syncedRecordCount === 'number' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.adminShell.syncedRecordsBanner(summary.syncedRecordCount)}
              onPress={() => router.push('/(admin)/synced-records' as Href)}
              style={({ pressed }) => [
                styles.syncedBanner,
                {
                  backgroundColor: themedMintSurface(colors, isDark),
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              testID="admin-synced-record-count"
            >
              <AppText variant="bodyStrong" style={{ color: colors.textPrimary }}>
                {t.adminShell.syncedRecordsBanner(summary.syncedRecordCount)}
              </AppText>
              <AppText variant="caption" color="secondary">
                {t.adminShell.openSyncedRecords}
              </AppText>
            </Pressable>
          ) : null}
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
        roleLabel={t.auth.unlockAdminRole}
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
          void switchWorkspace('worker').then((result) => {
            if (result.ok) {
              router.replace('/(worker)');
            }
          });
        }}
        onOpenSync={() => {
          setMenuVisible(false);
          router.push('/(admin)/synced-records' as Href);
        }}
        onOpenReminders={() => {
          setMenuVisible(false);
          router.push('/(admin)/activity' as Href);
        }}
        onOpenSettings={() => {
          setMenuVisible(false);
          router.push('/(admin)/settings' as Href);
        }}
      />
    </View>
  );
}

export function AccountListScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { touchActivity } = useAuthSession();
  const services = useAdministrationServices();
  const offlineProvisioning = useOfflineProvisioningServices();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<readonly AdminAccountSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(ACCOUNT_LIST_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<'none' | 'offline' | 'generic'>('none');
  const [usingLocalAccounts, setUsingLocalAccounts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKind('none');
    const searchQuery = {
      page,
      pageSize: ACCOUNT_LIST_PAGE_SIZE,
      search: query.trim() || undefined,
    };
    try {
      const result = await services.searchAccounts(searchQuery);
      setItems(result.items);
      setTotal(result.total);
      setPageSize(result.pageSize);
      setUsingLocalAccounts(false);
    } catch (error) {
      if (offlineProvisioning) {
        try {
          const local = await offlineProvisioning.listProvisionedAccounts(searchQuery);
          setItems(local.items);
          setTotal(local.total);
          setPageSize(local.pageSize);
          setUsingLocalAccounts(true);
          setErrorKind('none');
          return;
        } catch {
          // fall through to error state below
        }
      }
      setItems([]);
      setUsingLocalAccounts(false);
      setErrorKind(mapAdministrationError(error) === 'offline' ? 'offline' : 'generic');
    } finally {
      setLoading(false);
    }
  }, [offlineProvisioning, page, query, services]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminPortalShell testID="admin-account-list">
      <WorkerHubHeader
        title={t.administration.accountsTitle}
        subtitle={t.administration.searchPlaceholder}
        onBack={() => router.back()}
        onHome={() => router.replace('/(admin)')}
      />
      <AppButton
        label={t.administration.registerWorker}
        onPress={() => router.push('/(admin)/accounts/register' as Href)}
        testID="admin-register-worker"
      />
      <SearchInput
        label={t.administration.searchPlaceholder}
        placeholder={t.administration.searchPlaceholder}
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setPage(1);
        }}
        autoCorrect={false}
      />
      {loading ? <LoadingState message={t.administration.loading} /> : null}
      {!loading && usingLocalAccounts ? (
        <AppText variant="caption" color="secondary" testID="admin-local-accounts-notice">
          {t.administration.localAccountsNotice}
        </AppText>
      ) : null}
      {!loading && errorKind === 'offline' ? (
        <AdministrationOfflineState onRetry={() => void load()} />
      ) : null}
      {!loading && errorKind === 'generic' ? (
        <AppStateView
          variant="error"
          heading={t.administration.errorHeading}
          explanation={t.administration.retry}
          primaryActionLabel={t.administration.retry}
          onPrimaryAction={() => void load()}
        />
      ) : null}
      {!loading && errorKind === 'none' && items.length === 0 ? (
        <AppStateView
          variant="empty"
          heading={t.administration.emptyHeading}
          explanation={t.administration.emptyBody}
        />
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {items.map((account) => (
          <AccountListItem
            key={account.accountId}
            account={account}
            onPress={() => router.push(`/(admin)/accounts/${account.accountId}` as Href)}
          />
        ))}
      </View>
      {totalPages > 1 ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <AppButton
            label={t.administration.previousPage}
            variant="secondary"
            disabled={page <= 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          />
          <AppText variant="caption" color="secondary">
            {t.administration.pageLabel(page, totalPages)}
          </AppText>
          <AppButton
            label={t.administration.nextPage}
            variant="secondary"
            disabled={page >= totalPages}
            onPress={() => setPage((current) => current + 1)}
          />
        </View>
      ) : null}
    </AdminPortalShell>
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
    maxWidth: '92%',
  },
  greeting: {
    fontWeight: '800',
  },
  greetingHint: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
  },
  workspaceHint: {
    color: 'rgba(255,255,255,0.78)',
    marginTop: spacing.xxs,
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
  syncedBanner: {
    borderRadius: radii.lg,
    padding: spacing.base,
    gap: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.sm,
  },
});
