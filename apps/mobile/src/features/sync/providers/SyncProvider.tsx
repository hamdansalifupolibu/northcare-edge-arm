import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getAppConfig } from '../../../config/appConfig';
import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { createSecureAccessTokenStore, requestDevelopmentAccessToken } from '../application/accessTokenStore';
import { createRepositorySyncStore } from '../application/repositorySyncStore';
import { loadSyncPreferences, saveSyncPreferences } from '../preferences/syncPreferences';
import { categoriseSyncError, type SyncErrorCategory } from '../domain/syncStatus';
import { createSyncEngine, type SyncRunResult } from '../engine/syncEngine';
import { createSyncTransport } from '../transport/syncTransport';

type SyncContextValue = {
  readonly syncing: boolean;
  readonly lastResult: SyncRunResult | null;
  readonly error: string | null;
  readonly errorCategory: SyncErrorCategory | null;
  readonly syncConfigured: boolean;
  readonly autoSyncWhenOnline: boolean;
  readonly syncNow: () => Promise<{ readonly ok: boolean }>;
  readonly setAutoSyncWhenOnline: (enabled: boolean) => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { readonly children: ReactNode }) {
  const { repositories, getDriver } = useDatabase();
  const { session } = useAuthSession();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<SyncErrorCategory | null>(null);
  const [autoSyncWhenOnline, setAutoSyncWhenOnlineState] = useState(true);
  const syncConfigured = Boolean(getAppConfig().apiBaseUrl);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef<Promise<{ readonly ok: boolean }> | null>(null);
  const autoSyncRef = useRef(autoSyncWhenOnline);
  autoSyncRef.current = autoSyncWhenOnline;

  useEffect(() => {
    void loadSyncPreferences().then((prefs) => {
      setAutoSyncWhenOnlineState(prefs.autoSyncWhenOnline);
    });
  }, []);

  const setAutoSyncWhenOnline = useCallback(async (enabled: boolean) => {
    setAutoSyncWhenOnlineState(enabled);
    await saveSyncPreferences({ autoSyncWhenOnline: enabled });
  }, []);

  const syncNow = useCallback(async (): Promise<{ readonly ok: boolean }> => {
    if (running.current) return running.current;
    running.current = (async (): Promise<{ readonly ok: boolean }> => {
      const db = getDriver();
      if (!repositories || !session || !db) return { ok: false };
      if (!syncConfigured) return { ok: false };
      setSyncing(true);
      setError(null);
      setErrorCategory(null);
      try {
        const tokenStore = createSecureAccessTokenStore();
        if (!(await tokenStore.getAccessToken()) && getAppConfig().appEnv === 'development') {
          const password = process.env.EXPO_PUBLIC_DEV_SYNC_DEMO_PASSWORD?.trim();
          if (password) {
            try {
              const token = await requestDevelopmentAccessToken({
                accountId: session.accountId,
                password,
              });
              await tokenStore.saveAccessToken(token.accessToken);
            } catch {
              // Sync below will surface authentication if token refresh fails.
            }
          }
        }
        const store = createRepositorySyncStore(
          repositories,
          `${session.accountId}:${session.organisationId}:${session.facilityId}`,
          db,
        );
        const engine = createSyncEngine(createSyncTransport(tokenStore), store);
        setLastResult(await engine.syncNow());
        return { ok: true };
      } catch (syncError) {
        setErrorCategory(categoriseSyncError(syncError));
        setError(syncError instanceof Error ? syncError.message : null);
        return { ok: false };
      } finally {
        setSyncing(false);
      }
    })().finally(() => { running.current = null; });
    return running.current;
  }, [getDriver, repositories, session, syncConfigured]);

  const scheduleForegroundSync = useCallback(() => {
    if (!autoSyncRef.current) {
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void syncNow(); }, 1_000);
  }, [syncNow]);

  useEffect(() => {
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      if (!autoSyncRef.current || !syncConfigured) {
        return;
      }
      if (state.isConnected && state.isInternetReachable !== false) scheduleForegroundSync();
    });
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (!autoSyncRef.current || !syncConfigured) {
        return;
      }
      if (state === 'active') scheduleForegroundSync();
    });
    return () => {
      unsubscribeNetwork();
      subscription.remove();
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [scheduleForegroundSync, syncConfigured]);

  const value = useMemo(
    () => ({
      syncing,
      lastResult,
      error,
      errorCategory,
      syncConfigured,
      autoSyncWhenOnline,
      syncNow,
      setAutoSyncWhenOnline,
    }),
    [
      autoSyncWhenOnline,
      error,
      errorCategory,
      lastResult,
      setAutoSyncWhenOnline,
      syncConfigured,
      syncNow,
      syncing,
    ],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
}
