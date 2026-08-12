import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getAppConfig } from '../config/appConfig';
import { useDatabaseOptional } from '../data/providers/DatabaseProvider';
import { createLogger } from '../logging/logger';
import {
  getAppPreferencesRepository,
  type AppPreferences,
  type AppPreferencesRepository,
  type WorkspacePreference,
} from '../preferences';
import {
  postSplashRoute,
  resolveLaunchState,
  type LaunchRoute,
  type LaunchState,
} from './launchState';

type LaunchContextValue = {
  readonly ready: boolean;
  readonly launchState: LaunchState;
  readonly preferences: AppPreferences | null;
  readonly errorMessage: string | null;
  readonly databaseReadiness: string | null;
  readonly refresh: (options?: { readonly retryDatabase?: boolean }) => Promise<void>;
  readonly completeOnboarding: () => Promise<void>;
  readonly selectWorkspace: (workspace: WorkspacePreference) => Promise<void>;
  readonly clearWorkspace: () => Promise<void>;
  readonly resetOnboardingForDevelopment: () => Promise<void>;
  readonly routeAfterSplash: LaunchRoute;
};

const LaunchContext = createContext<LaunchContextValue | null>(null);

const logger = createLogger({ environment: getAppConfig().appEnv });

export function LaunchProvider({
  children,
  repository = getAppPreferencesRepository(),
  fontsReady,
}: {
  readonly children: ReactNode;
  readonly repository?: AppPreferencesRepository;
  readonly fontsReady: boolean;
}) {
  const database = useDatabaseOptional();
  const databaseRef = useRef(database);
  databaseRef.current = database;
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { readonly retryDatabase?: boolean }) => {
    try {
      if (options?.retryDatabase && databaseRef.current?.readiness === 'failed') {
        await databaseRef.current.retry();
      }
      const next = await repository.getPreferences();
      setPreferences(next);
      setErrorMessage(null);
      setReady(true);
    } catch (error) {
      logger.error('Failed to read preferences', {
        message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
      });
      setErrorMessage('Preferences could not be read.');
      setReady(true);
    }
  }, [repository]);

  useEffect(() => {
    if (!fontsReady) {
      return;
    }
    // Load preferences after fonts are ready (external storage sync).
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [fontsReady, refresh]);

  const databaseReady = database == null || database.readiness === 'ready';
  const databaseFailed = database?.readiness === 'failed';

  const launchState = useMemo((): LaunchState => {
    if (databaseFailed) {
      return 'launchError';
    }
    if (!fontsReady || !ready || !databaseReady) {
      return 'preparing';
    }
    if (errorMessage && preferences === null) {
      return 'launchError';
    }
    return resolveLaunchState({
      foundationReady: true,
      onboardingVersionCompleted: preferences?.onboardingVersionCompleted ?? null,
      selectedWorkspace: preferences?.selectedWorkspace ?? null,
      preferenceError: false,
    });
  }, [
    databaseFailed,
    databaseReady,
    errorMessage,
    fontsReady,
    preferences,
    ready,
  ]);

  const completeOnboarding = useCallback(async () => {
    await repository.setOnboardingCompleted();
    await refresh();
  }, [refresh, repository]);

  const selectWorkspace = useCallback(
    async (workspace: WorkspacePreference) => {
      await repository.setSelectedWorkspace(workspace);
      await refresh();
    },
    [refresh, repository],
  );

  const clearWorkspace = useCallback(async () => {
    await repository.clearSelectedWorkspace();
    await refresh();
  }, [refresh, repository]);

  const resetOnboardingForDevelopment = useCallback(async () => {
    await repository.resetOnboardingForDevelopment();
    await refresh();
  }, [refresh, repository]);

  const value = useMemo(
    (): LaunchContextValue => ({
      ready: ready && (databaseReady || databaseFailed),
      launchState,
      preferences,
      errorMessage: databaseFailed
        ? database?.errorMessage ?? 'Local storage could not be prepared.'
        : errorMessage,
      databaseReadiness: database?.readiness ?? null,
      refresh,
      completeOnboarding,
      selectWorkspace,
      clearWorkspace,
      resetOnboardingForDevelopment,
      routeAfterSplash: postSplashRoute(launchState),
    }),
    [
      clearWorkspace,
      completeOnboarding,
      database?.errorMessage,
      database?.readiness,
      databaseFailed,
      databaseReady,
      errorMessage,
      launchState,
      preferences,
      ready,
      refresh,
      resetOnboardingForDevelopment,
      selectWorkspace,
    ],
  );

  return <LaunchContext.Provider value={value}>{children}</LaunchContext.Provider>;
}

export function useLaunch(): LaunchContextValue {
  const ctx = useContext(LaunchContext);
  if (ctx === null) {
    throw new Error('useLaunch must be used within LaunchProvider');
  }
  return ctx;
}
