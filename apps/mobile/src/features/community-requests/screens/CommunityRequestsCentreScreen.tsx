import { useFocusEffect, useRouter, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, FlatList, StyleSheet, View, type AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, LoadingState } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { layout, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../../worker-home/domain/workerNav';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { ReachCentreBackground } from '../components/ReachCentreBackground';
import { ReachCentreEmptyState } from '../components/ReachCentreEmptyState';
import { ReachCentreHeader } from '../components/ReachCentreHeader';
import { ReachFilterSegment } from '../components/ReachFilterSegment';
import { ReachLiveStatsRow } from '../components/ReachLiveStatsRow';
import { ReachRequestCard } from '../components/ReachRequestCard';
import { ReachSandboxLauncherCard } from '../components/ReachSandboxLauncherCard';
import { CommunityRequestErrorState } from '../components/CommunityRequestStateViews';
import { REACH_DEMO_CONFIG } from '../config/reachDemoConfig';
import { isDemoReachRequestId, reopenSyntheticReachDemoRequest } from '../demo/reachDemoInbox';
import { mapCommunityRequestError } from '../domain/errors';
import type { CommunityRequestListFilter, WorkerRequestListItem } from '../domain/types';
import { useCommunityRequestServices } from '../hooks/useCommunityRequestServices';
import { useReachLiveStats } from '../hooks/useReachLiveStats';
import { subscribeCommunityRequestViewClears } from '../session/communityRequestViewStore';

const FILTERS: readonly CommunityRequestListFilter[] = [
  'awaiting',
  'assignedToMe',
  'emergency',
  'handled',
];

export function CommunityRequestsCentreScreen() {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useThemeMode();
  const { isOnline, checking } = useConnectivity();
  const services = useCommunityRequestServices();
  const servicesRef = useRef(services);
  servicesRef.current = services;
  const { session, touchActivity, authState } = useAuthSession();
  const [filter, setFilter] = useState<CommunityRequestListFilter>('awaiting');
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const [items, setItems] = useState<readonly WorkerRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [focusPulseKey, setFocusPulseKey] = useState(0);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const screenFocusedRef = useRef(false);
  const statsEnabled = Boolean(session) && authState === 'authenticated';
  const { refresh: refreshLiveStats, ...liveStats } = useReachLiveStats(statsEnabled);
  const refreshLiveStatsRef = useRef(refreshLiveStats);
  refreshLiveStatsRef.current = refreshLiveStats;

  const load = useCallback(
    async (
      nextFilter: CommunityRequestListFilter,
      options?: { readonly silent?: boolean },
    ) => {
      if (!session || authState !== 'authenticated') {
        setLoading(false);
        return;
      }
      if (inFlightRef.current) {
        return;
      }
    inFlightRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const showSpinner = !options?.silent && !hasLoadedOnceRef.current;
    if (showSpinner) {
      setLoading(true);
    } else if (hasLoadedOnceRef.current) {
      setRefreshing(true);
    }
      try {
        const response = await servicesRef.current.listCommunityRequests(nextFilter, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(response.items);
        setError(null);
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err);
        if (!hasLoadedOnceRef.current) {
          setItems([]);
        }
      } finally {
        inFlightRef.current = false;
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [authState, session],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    return subscribeCommunityRequestViewClears(() => {
      setItems([]);
      setError(null);
      hasLoadedOnceRef.current = false;
      setHasLoadedOnce(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      screenFocusedRef.current = true;
      setFocusPulseKey((value) => value + 1);
      void loadRef.current(filterRef.current, { silent: hasLoadedOnceRef.current });
      if (statsEnabled) {
        refreshLiveStatsRef.current();
      }
      return () => {
        screenFocusedRef.current = false;
        abortRef.current?.abort();
      };
    }, [statsEnabled]),
  );

  useEffect(() => {
    if (!screenFocusedRef.current) {
      return;
    }
    void load(filter, { silent: hasLoadedOnceRef.current });
  }, [filter, load]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (
        next === 'active' &&
        screenFocusedRef.current &&
        authState === 'authenticated' &&
        session
      ) {
        void loadRef.current(filterRef.current, { silent: true });
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [authState, session]);

  const errorKind = error ? mapCommunityRequestError(error) : null;
  const showHardBlock =
    errorKind === 'offline' ||
    errorKind === 'reachDisabled' ||
    errorKind === 'forbidden';

  const centre = t.communityRequests.centre;
  const liveLabel = checking
    ? '…'
    : isOnline
      ? centre.liveOnline
      : centre.liveOffline;

  const statTiles = [
    {
      key: 'awaiting' as const,
      label: centre.statAwaiting,
      count: liveStats.awaiting,
      filter: 'awaiting' as const,
    },
    {
      key: 'emergency' as const,
      label: centre.statEmergency,
      count: liveStats.emergency,
      filter: 'emergency' as const,
      urgent: true,
    },
    {
      key: 'assignedToMe' as const,
      label: centre.statAssigned,
      count: liveStats.assignedToMe,
      filter: 'assignedToMe' as const,
    },
  ];

  const inlineNotice =
    errorKind === 'auth'
      ? centre.inboxAuthHint
      : error && !showHardBlock
        ? centre.inboxLoadHint
        : null;

  const refreshInbox = useCallback(() => {
    void load(filter, { silent: true });
    refreshLiveStatsRef.current();
  }, [filter, load]);

  const runDemoAction = useCallback(
    async (
      item: WorkerRequestListItem,
      action: 'take' | 'solve' | 'reopen',
    ) => {
      if (!isDemoReachRequestId(item.requestId)) {
        return;
      }
      setActionBusyId(item.requestId);
      try {
        if (action === 'take') {
          await services.acknowledgeCommunityRequest(item.requestId, item.version);
        } else if (action === 'solve') {
          await services.markCommunityRequestHandled(item.requestId, item.version);
        } else {
          reopenSyntheticReachDemoRequest(item.requestId, item.version);
        }
        refreshInbox();
      } catch (err) {
        const kind = mapCommunityRequestError(err);
        if (kind === 'conflict') {
          refreshInbox();
        }
        Alert.alert(t.communityRequests.errorTitle, t.communityRequests.errorBody);
      } finally {
        setActionBusyId(null);
      }
    },
    [refreshInbox, services, t.communityRequests.errorBody, t.communityRequests.errorTitle],
  );

  const confirmDemoAction = useCallback(
    (
      item: WorkerRequestListItem,
      action: 'take' | 'solve' | 'reopen',
    ) => {
      const copy =
        action === 'take'
          ? {
              title: t.communityRequests.acknowledgeConfirmTitle,
              body: centre.takeRequestHint,
            }
          : action === 'solve'
            ? {
                title: t.communityRequests.markHandledConfirmTitle,
                body: centre.markSolvedHint,
              }
            : {
                title: centre.reopenRequest,
                body: centre.reopenRequestHint,
              };
      Alert.alert(copy.title, copy.body, [
        { text: t.communityRequests.cancelAction, style: 'cancel' },
        {
          text: t.communityRequests.confirmAction,
          onPress: () => {
            void runDemoAction(item, action);
          },
        },
      ]);
    },
    [
      centre.markSolvedHint,
      centre.reopenRequest,
      centre.reopenRequestHint,
      centre.takeRequestHint,
      runDemoAction,
      t.communityRequests.acknowledgeConfirmTitle,
      t.communityRequests.cancelAction,
      t.communityRequests.confirmAction,
      t.communityRequests.markHandledConfirmTitle,
    ],
  );

  const listHeader = (
    <View style={styles.headerStack}>
      <ReachCentreHeader
        title={t.communityRequests.title}
        subtitle={t.communityRequests.subtitle}
        liveLabel={liveLabel}
        isOnline={isOnline}
        checking={checking}
        refreshLabel={centre.refreshAccessibility}
        backLabel={t.communityRequests.back}
        refreshing={refreshing}
        onRefresh={() => {
          void load(filter, { silent: true });
          refreshLiveStatsRef.current();
        }}
        onBack={() => router.back()}
      />
      <ReachSandboxLauncherCard
        title={centre.openSandboxLauncher}
        sandboxBadge={centre.sandboxBadge}
      />
      {!showHardBlock ? (
        <>
          <AppText variant="caption" color="secondary" testID="reach-centre-demo-preview-hint">
            {centre.demoPreviewHint}
          </AppText>
          <ReachLiveStatsRow
            tiles={statTiles}
            selectedFilter={filter}
            onSelectFilter={setFilter}
          />
          <ReachFilterSegment
            filters={FILTERS}
            labels={centre.filterShort}
            selected={filter}
            onSelect={setFilter}
          />
        </>
      ) : null}
      {loading && !hasLoadedOnce ? <LoadingState message={t.communityRequests.loading} /> : null}
      {inlineNotice ? (
        <AppText variant="caption" color="secondary" testID="reach-centre-inline-notice">
          {inlineNotice}
        </AppText>
      ) : null}
      {showHardBlock && error ? (
        <CommunityRequestErrorState
          error={error}
          onRetry={() => {
            void load(filter, { silent: true });
          }}
          onBack={() => router.replace('/(worker)' as Href)}
        />
      ) : null}
    </View>
  );

  return (
    <View
      style={[styles.root, { backgroundColor: themeColors.background }]}
      testID="community-requests-centre-screen"
    >
      <ReachCentreBackground focusPulseKey={focusPulseKey} />
      {!showHardBlock ? (
        <FlatList
          data={[...items]}
          keyExtractor={(item) => item.requestId}
          accessibilityLabel={t.communityRequests.title}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: insets.bottom + WORKER_BOTTOM_NAV_CLEARANCE + spacing.lg,
            },
          ]}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            loading ? null : (
              <ReachCentreEmptyState
                heading={centre.emptyHeading}
                explanation={
                  filter === 'emergency'
                    ? t.communityRequests.emergencyLiveIntegrationNotActive
                    : centre.emptyExplanation
                }
                sandboxBadge={centre.sandboxBadge}
                ctaLabel={t.reachDemo.openSimulator}
                onOpenSandbox={() => {
                  void Linking.openURL(REACH_DEMO_CONFIG.atUssdSimulatorUrl);
                }}
                testID={`community-requests-empty-${filter}`}
              />
            )
          }
          renderItem={({ item, index }) => (
            <ReachRequestCard
              item={item}
              index={index}
              onPress={() =>
                router.push(`/(worker)/community-requests/${item.requestId}` as Href)
              }
              onTake={() => confirmDemoAction(item, 'take')}
              onMarkSolved={() => confirmDemoAction(item, 'solve')}
              onReopen={() => confirmDemoAction(item, 'reopen')}
              actionsBusy={actionBusyId === item.requestId}
            />
          )}
        />
      ) : (
        <View
          style={[
            styles.blockingContent,
            {
              paddingTop: insets.top + spacing.sm,
              paddingHorizontal: layout.screenHorizontalPadding,
            },
          ]}
        >
          {listHeader}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    gap: spacing.sm,
  },
  headerStack: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  blockingContent: {
    flex: 1,
  },
});
