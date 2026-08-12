import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { createLogger } from '../../../logging/logger';
import { createExpoBiometricService, type BiometricService } from '../biometrics/biometricService';
import { createPinVerifier, verifyPin } from '../crypto/pinVerifier';
import {
  DEVELOPMENT_OFFLINE_ACCESS_POLICY,
  isOfflineEntitlementValid,
} from '../domain/offlinePolicy';
import {
  SESSION_ENVELOPE_SCHEMA_VERSION,
  type LocalSessionEnvelope,
} from '../domain/sessionEnvelope';
import type {
  AuthAccount,
  AuthRole,
  AuthSessionState,
  BiometricAvailability,
  SafeAuthError,
} from '../domain/types';
import { createRemoteAuthProvider } from '../services/createRemoteAuthProvider';
import type { RemoteAuthProvider } from '../services/RemoteAuthProvider';
import { createSecureStoreSessionRepository } from '../storage/secureStoreSessionRepository';
import type { SecureSessionRepository } from '../storage/SecureSessionRepository';
import { validatePinConfirmation, validatePinFormat } from '../validation/pinValidation';
import { clearAssistantConversation } from '../../assistant/session/assistantConversationStore';
import { createAdministrationApiClient } from '../../administration/transport/administrationApiClient';
import { clearCommunityRequestViews } from '../../community-requests/session/communityRequestViewStore';
import {
  createSecureAccessTokenStore,
  requestDevelopmentAccessToken,
} from '../../sync/application/accessTokenStore';
import { bootstrapDevBypassSyncToken } from '../../sync/application/devSyncTokenBootstrap';
import { clearPendingPassportToken } from '../../referrals/security/transientPassportTokenStore';
import { mapServerRolesToMobile, workspaceForRole } from '../domain/roles';
import { firstTimeStepAfterSignIn } from '../domain/firstTimeSetupFlow';
import type { WorkspaceId } from '../domain/workspaces';
import {
  resolveActiveWorkspaceForSetup,
  resolveSingleWorkspace,
  workspaceRole,
} from '../domain/workspaces';
import { resolveAuthenticatedHomeRoute } from '../navigation/postAuthNavigation';
import {
  createDevBypassAccount,
  createDevBypassSessionEnvelope,
  isDevAuthBypassEnabled,
} from '../development/devAuthBypass';
import { authAccountFromActivationClaims } from '../../administration/domain/offlineActivationAccount';
import type { SignedActivationClaimsV1 } from '../../administration/security/signedActivationClaims';

const logger = createLogger({ environment: getAppConfig().appEnv });

async function withSecureStoreTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

type FirstTimeStep =
  | 'none'
  | 'passwordChange'
  | 'facility'
  | 'createPin'
  | 'confirmPin'
  | 'biometric'
  | 'complete';

type AuthContextValue = {
  readonly ready: boolean;
  readonly authState: AuthSessionState;
  readonly account: AuthAccount | null;
  readonly session: LocalSessionEnvelope | null;
  readonly firstTimeStep: FirstTimeStep;
  /** Role chosen at sign-in; used for dual-role facility/setup routing. */
  readonly setupSignInRole: AuthRole | null;
  readonly pendingPin: string | null;
  readonly lastError: SafeAuthError | null;
  readonly biometricAvailability: BiometricAvailability;
  readonly pinLockedUntilMs: number | null;
  readonly signIn: (input: {
    loginIdentifier: string;
    password: string;
    expectedRole: AuthRole;
  }) => Promise<{ ok: boolean; error?: SafeAuthError }>;
  readonly changePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ ok: boolean; error?: SafeAuthError }>;
  readonly confirmFacility: () => Promise<void>;
  readonly rejectFacility: () => Promise<void>;
  readonly setDraftPin: (pin: string) => { ok: boolean; reason?: string };
  readonly confirmPin: (
    pin: string,
  ) => Promise<{ ok: boolean; reason?: string; next?: 'biometric' | 'complete' }>;
  readonly enableBiometrics: () => Promise<void>;
  readonly skipBiometrics: () => Promise<void>;
  readonly completeSetup: () => Promise<{ redirectTo: string }>;
  readonly unlockWithPin: (
    pin: string,
  ) => Promise<{ ok: boolean; redirectTo?: string; error?: SafeAuthError }>;
  readonly unlockWithBiometric: () => Promise<{ ok: boolean; redirectTo?: string; error?: SafeAuthError }>;
  readonly lock: () => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly changeAccount: () => Promise<void>;
  readonly requestPasswordReset: (loginIdentifier: string) => Promise<string>;
  readonly clearError: () => void;
  readonly touchActivity: () => void;
  readonly remoteProviderId: RemoteAuthProvider['id'];
  readonly selectActiveWorkspace: (
    workspace: WorkspaceId,
  ) => Promise<{ ok: boolean; error?: SafeAuthError }>;
  readonly switchWorkspace: (
    workspace: WorkspaceId,
  ) => Promise<{ ok: boolean; error?: SafeAuthError }>;
  readonly workspaceSelectionRequired: boolean;
  readonly beginOfflineWorkerActivation: (
    claims: SignedActivationClaimsV1,
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildSessionEnvelope(
  account: AuthAccount,
  biometricEnabled: boolean,
  activeWorkspace: WorkspaceId | null,
): LocalSessionEnvelope {
  const permittedWorkspaces = [...account.permittedWorkspaces] as WorkspaceId[];
  const availableRoles = [...account.availableRoles] as AuthRole[];
  const resolvedWorkspace = activeWorkspace ?? resolveSingleWorkspace(permittedWorkspaces);
  const role = resolvedWorkspace ? workspaceRole(resolvedWorkspace) : account.role;
  return {
    schemaVersion: SESSION_ENVELOPE_SCHEMA_VERSION,
    accountId: account.accountId,
    role,
    availableRoles,
    permittedWorkspaces,
    activeWorkspace: resolvedWorkspace,
    displayName: account.displayName,
    facilityId: account.facilityId,
    facilityName: account.facilityName,
    organisationId: account.organisationId,
    lastRemoteVerificationAt: account.remoteAuthenticationTime || new Date().toISOString(),
    offlineAccessPolicyVersion: DEVELOPMENT_OFFLINE_ACCESS_POLICY.version,
    localSetupCompletedAt: new Date().toISOString(),
    biometricEnabled,
    sessionState: 'ready',
  };
}

function nextAuthStateAfterUnlock(session: LocalSessionEnvelope): AuthSessionState {
  if (session.activeWorkspace !== null) {
    return 'authenticated';
  }
  if (session.permittedWorkspaces.length > 1) {
    return 'workspaceSelectionRequired';
  }
  return 'authenticated';
}

function nextAuthStateAfterSetup(session: LocalSessionEnvelope): AuthSessionState {
  if (session.activeWorkspace !== null) {
    return 'authenticated';
  }
  if (session.permittedWorkspaces.length > 1) {
    return 'workspaceSelectionRequired';
  }
  return 'authenticated';
}

function nowMs(clock?: () => number): number {
  return clock ? clock() : Date.now();
}

function isWorkspaceId(value: string): value is WorkspaceId {
  return value === 'worker' || value === 'administration';
}

/** Stable default — inline `() => Date.now()` in props re-creates every render. */
const DEFAULT_CLOCK = (): number => Date.now();

export function AuthSessionProvider({
  children,
  remoteAuth: remoteAuthProp,
  secureSession: secureSessionProp,
  biometrics: biometricsProp,
  clock: clockProp,
}: {
  readonly children: ReactNode;
  readonly remoteAuth?: RemoteAuthProvider;
  readonly secureSession?: SecureSessionRepository;
  readonly biometrics?: BiometricService;
  readonly clock?: () => number;
}) {
  // Default factories must not run in the parameter list — that allocates new
  // service identities every render, recreates `hydrate`, and retriggers its effect
  // → Maximum update depth (setReady inside hydrate).
  const remoteAuth = useMemo(
    () => remoteAuthProp ?? createRemoteAuthProvider(),
    [remoteAuthProp],
  );
  const secureSession = useMemo(
    () => secureSessionProp ?? createSecureStoreSessionRepository(),
    [secureSessionProp],
  );
  const biometrics = useMemo(
    () => biometricsProp ?? createExpoBiometricService(),
    [biometricsProp],
  );
  const clock = clockProp ?? DEFAULT_CLOCK;

  const [ready, setReady] = useState(false);
  const [authState, setAuthStateState] = useState<AuthSessionState>('preparing');
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [session, setSessionState] = useState<LocalSessionEnvelope | null>(null);
  const [firstTimeStep, setFirstTimeStep] = useState<FirstTimeStep>('none');
  const [setupSignInRole, setSetupSignInRole] = useState<AuthRole | null>(null);
  const [pendingPin, setPendingPin] = useState<string | null>(null);
  const [lastError, setLastError] = useState<SafeAuthError | null>(null);
  const [biometricAvailability, setBiometricAvailability] =
    useState<BiometricAvailability>('notAvailable');
  const [pinLockedUntilMs, setPinLockedUntilMs] = useState<number | null>(null);
  const [lastActivityMs, setLastActivityMs] = useState(() => nowMs(clock));
  const lastActivityRef = useRef(lastActivityMs);
  const authStateRef = useRef<AuthSessionState>('preparing');
  const sessionRef = useRef<LocalSessionEnvelope | null>(null);
  const readyRef = useRef(false);
  const hydrateStartedRef = useRef(false);
  /** Workspace chosen via launch/login role; survives PIN setup for dual-role accounts. */
  const preferredWorkspaceRef = useRef<WorkspaceId | null>(null);

  const markReady = useCallback(() => {
    if (readyRef.current) {
      return;
    }
    readyRef.current = true;
    setReady(true);
  }, []);

  const setAuthState = useCallback((next: AuthSessionState) => {
    authStateRef.current = next;
    setAuthStateState(next);
  }, []);

  const setSession = useCallback((next: LocalSessionEnvelope | null) => {
    sessionRef.current = next;
    setSessionState(next);
  }, []);

  useEffect(() => {
    lastActivityRef.current = lastActivityMs;
  }, [lastActivityMs]);

  const hydrate = useCallback(async () => {
    try {
      // Temporary development bypass: skip PIN/login and present workspace selection.
      // Login screens and normal auth paths remain in the tree; this only short-circuits hydrate.
      if (isDevAuthBypassEnabled() && authStateRef.current === 'preparing') {
        const nowIso = new Date(nowMs(clock)).toISOString();
        const bypassSession: LocalSessionEnvelope = {
          ...createDevBypassSessionEnvelope(nowIso),
          activeWorkspace: 'worker',
        };
        const bypassAccount = createDevBypassAccount(nowIso);
        // Do not block app startup on SecureStore write when bypass is active
        void secureSession.saveSessionEnvelope(bypassSession).catch(() => {});
        setAccount(bypassAccount);
        setSession(bypassSession);
        setAuthState('authenticated');
        setPinLockedUntilMs(null);
        setBiometricAvailability('notAvailable');
        logger.info('Development auth bypass active — remote login skipped, direct to worker workspace');
        void bootstrapDevBypassSyncToken().catch(() => {});
        markReady();
        return;
      }

      const envelope = await withSecureStoreTimeout(secureSession.loadSessionEnvelope(), 3000, null);
      const attempts = await withSecureStoreTimeout(secureSession.loadPinAttemptState(), 3000, {
        failedAttempts: 0,
        lockedUntilMs: null,
      });
      const availability = await withSecureStoreTimeout(
        biometrics.getAvailability(),
        3000,
        'notAvailable' as const,
      );
      const biometricEnabled = await withSecureStoreTimeout(
        secureSession.loadBiometricEnabled(),
        3000,
        false,
      );

      // Apply hydrate only while still preparing so a slow load cannot
      // overwrite an in-progress sign-in started after mount.
      if (authStateRef.current !== 'preparing') {
        markReady();
        return;
      }

      setPinLockedUntilMs(attempts.lockedUntilMs);
      setBiometricAvailability(
        biometricEnabled && availability === 'available' ? 'enabled' : availability,
      );

      if (envelope === null) {
        setSession(null);
        setAccount(null);
        setAuthState('signedOut');
        markReady();
        return;
      }

      // Discard PINless temporary bypass envelopes once the bypass flag is off.
      const pinVerifier = await secureSession.loadPinVerifier();
      if (
        pinVerifier === null &&
        envelope.accountId === createDevBypassAccount().accountId
      ) {
        await secureSession.clearAllAuthMaterial();
        await createSecureAccessTokenStore().clearAccessToken();
        setSession(null);
        setAccount(null);
        setAuthState('signedOut');
        markReady();
        return;
      }

      if (
        !isOfflineEntitlementValid(
          envelope.lastRemoteVerificationAt,
          nowMs(clock),
          DEVELOPMENT_OFFLINE_ACCESS_POLICY,
        )
      ) {
        setSession(envelope);
        setAuthState('sessionExpired');
        markReady();
        return;
      }

      setSession(envelope);
      // Always start locked after cold start when a local session exists.
      setAuthState('locked');
      markReady();
    } catch (error) {
      logger.error('Auth hydrate failed', {
        message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
      });
      if (authStateRef.current === 'preparing') {
        setAuthState('error');
      }
      markReady();
    }
  }, [biometrics, clock, markReady, secureSession, setAuthState, setSession]);

  useLayoutEffect(() => {
    if (hydrateStartedRef.current) {
      return;
    }
    hydrateStartedRef.current = true;
    void hydrate();
  }, [hydrate]);

  const applyInactivityLock = useCallback(async () => {
    if (isDevAuthBypassEnabled()) {
      return;
    }
    clearAssistantConversation();
    const currentSession = sessionRef.current;
    if (currentSession) {
      const locked = { ...currentSession, sessionState: 'locked' as const };
      await secureSession.saveSessionEnvelope(locked);
      setSession(locked);
    }
    setAuthState('locked');
  }, [secureSession, setAuthState, setSession]);

  useEffect(() => {
    if (authState !== 'authenticated' || isDevAuthBypassEnabled()) {
      return;
    }
    const id = setInterval(() => {
      const idle = nowMs(clock) - lastActivityRef.current;
      if (idle >= DEVELOPMENT_OFFLINE_ACCESS_POLICY.sessionInactivityTimeoutMs) {
        void applyInactivityLock();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [applyInactivityLock, authState, clock]);

  useEffect(() => {
    const onAppStateChange = (next: AppStateStatus) => {
      if (next !== 'active') {
        return;
      }
      if (isDevAuthBypassEnabled()) {
        return;
      }
      if (authStateRef.current !== 'authenticated') {
        return;
      }
      const idle = nowMs(clock) - lastActivityRef.current;
      if (idle >= DEVELOPMENT_OFFLINE_ACCESS_POLICY.sessionInactivityTimeoutMs) {
        void applyInactivityLock();
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [applyInactivityLock, clock]);

  const touchActivity = useCallback(() => {
    setLastActivityMs(nowMs(clock));
  }, [clock]);

  const signIn: AuthContextValue['signIn'] = useCallback(
    async ({ loginIdentifier, password, expectedRole }) => {
      setLastError(null);
      touchActivity();
      const result = await remoteAuth.signIn({
        loginIdentifier,
        password,
        expectedRole,
      });

      if (!result.ok) {
        setLastError(result.error);
        if (result.error.code === 'passwordChangeRequired' && result.account) {
          preferredWorkspaceRef.current = workspaceForRole(expectedRole);
          setSetupSignInRole(expectedRole);
          setAccount(result.account);
          setAuthState('firstTimeSetupRequired');
          setFirstTimeStep('passwordChange');
          return { ok: false, error: result.error };
        }
        if (result.error.code === 'accountInactive' || result.error.code === 'accessRevoked') {
          setAuthState('accessRevoked');
        }
        return { ok: false, error: result.error };
      }

      preferredWorkspaceRef.current = workspaceForRole(expectedRole);
      setSetupSignInRole(expectedRole);
      setAccount(result.account);
      setAuthState('firstTimeSetupRequired');
      setFirstTimeStep(firstTimeStepAfterSignIn(expectedRole));

      // Best-effort sync token — never block demo sign-in on a down sync server.
      const config = getAppConfig();
      if (
        config.appEnv === 'development' &&
        config.apiBaseUrl &&
        remoteAuth.id === 'development' &&
        result.account
      ) {
        void (async () => {
          const store = createSecureAccessTokenStore();
          const syncFallback =
            process.env.EXPO_PUBLIC_DEV_SYNC_DEMO_PASSWORD?.trim() || 'NorthCareDemo1!';
          const attempts: { readonly email?: string; readonly accountId?: string; readonly password: string }[] =
            [
              {
                email: loginIdentifier.includes('@')
                  ? loginIdentifier.trim().toLowerCase()
                  : undefined,
                accountId: result.account!.accountId,
                password,
              },
              {
                email: loginIdentifier.includes('@')
                  ? loginIdentifier.trim().toLowerCase()
                  : undefined,
                accountId: result.account!.accountId,
                password: syncFallback,
              },
            ];
          for (const attempt of attempts) {
            try {
              const token = await requestDevelopmentAccessToken({
                email: attempt.email,
                accountId: attempt.email ? undefined : attempt.accountId,
                password: attempt.password,
              });
              await store.saveAccessToken(token.accessToken);
              return;
            } catch {
              // Try next password / identifier combination.
            }
          }
          // Local-first: missing sync token does not block authentication.
        })();
      }

      return { ok: true };
    },
    [remoteAuth, setAuthState, touchActivity],
  );

  const changePassword: AuthContextValue['changePassword'] = useCallback(
    async ({ currentPassword, newPassword }) => {
      const accountId = account?.accountId ?? session?.accountId;
      if (!accountId) {
        return {
          ok: false,
          error: { code: 'unknown', messageKey: 'unknown' },
        };
      }
      const result = await remoteAuth.changePassword({
        accountId,
        currentPassword,
        newPassword,
      });
      if (!result.ok) {
        setLastError(result.error);
        return { ok: false, error: result.error };
      }
      if (account) {
        setAccount(result.account);
        setFirstTimeStep(
          firstTimeStepAfterSignIn(
            setupSignInRole ??
              (preferredWorkspaceRef.current === 'administration'
                ? 'administrator'
                : result.account.role),
          ),
        );
      }
      return { ok: true };
    },
    [account, authState, remoteAuth, session?.accountId, setupSignInRole],
  );

  const confirmFacility = useCallback(async () => {
    setFirstTimeStep('createPin');
  }, []);

  const rejectFacility = useCallback(async () => {
    preferredWorkspaceRef.current = null;
    setSetupSignInRole(null);
    setAccount(null);
    setFirstTimeStep('none');
    setAuthState('signedOut');
    await remoteAuth.signOut();
  }, [remoteAuth, setAuthState]);

  const setDraftPin = useCallback((pin: string) => {
    const result = validatePinFormat(pin);
    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }
    setPendingPin(pin);
    setFirstTimeStep('confirmPin');
    return { ok: true };
  }, []);

  const finishLocalSetup = useCallback(
    async (biometricEnabled: boolean) => {
      if (!account || !pendingPin) {
        return;
      }
      const verifier = await createPinVerifier(pendingPin);
      await secureSession.savePinVerifier(verifier);
      await secureSession.saveBiometricEnabled(biometricEnabled);
      await secureSession.savePinAttemptState({ failedAttempts: 0, lockedUntilMs: null });

      const activeWorkspace = resolveActiveWorkspaceForSetup(
        account.permittedWorkspaces,
        preferredWorkspaceRef.current,
      );
      const envelope: LocalSessionEnvelope = buildSessionEnvelope(
        account,
        biometricEnabled,
        activeWorkspace,
      );
      await secureSession.saveSessionEnvelope(envelope);
      setSession(envelope);
      setPendingPin(null);
      setFirstTimeStep('complete');
      setBiometricAvailability(biometricEnabled ? 'enabled' : biometricAvailability);
    },
    [account, biometricAvailability, pendingPin, secureSession, setSession],
  );

  const confirmPin: AuthContextValue['confirmPin'] = useCallback(
    async (pin) => {
      if (!pendingPin) {
        return { ok: false, reason: 'mismatch' };
      }
      const result = validatePinConfirmation(pendingPin, pin);
      if (!result.ok) {
        return { ok: false, reason: result.reason };
      }
      const availability = await biometrics.getAvailability();
      setBiometricAvailability(availability);
      if (
        availability === 'available' &&
        DEVELOPMENT_OFFLINE_ACCESS_POLICY.biometricsPermitted
      ) {
        setFirstTimeStep('biometric');
        return { ok: true, next: 'biometric' };
      }
      await finishLocalSetup(false);
      return { ok: true, next: 'complete' };
    },
    [biometrics, finishLocalSetup, pendingPin],
  );

  const enableBiometrics = useCallback(async () => {
    const result = await biometrics.authenticate(enBiometricPrompt());
    await finishLocalSetup(result === 'success');
  }, [biometrics, finishLocalSetup]);

  const skipBiometrics = useCallback(async () => {
    await finishLocalSetup(false);
  }, [finishLocalSetup]);

  const completeSetup = useCallback(async () => {
    setFirstTimeStep('none');
    setSetupSignInRole(null);
    const currentSession = sessionRef.current;
    if (currentSession) {
      setAuthState(nextAuthStateAfterSetup(currentSession));
      touchActivity();
      return { redirectTo: resolveAuthenticatedHomeRoute(currentSession) };
    }
    setAuthState('authenticated');
    touchActivity();
    return { redirectTo: '/(worker)' };
  }, [setAuthState, touchActivity]);

  const unlockWithPin: AuthContextValue['unlockWithPin'] = useCallback(
    async (pin) => {
      touchActivity();
      const current = nowMs(clock);
      const [attempts, verifier] = await Promise.all([
        secureSession.loadPinAttemptState(),
        secureSession.loadPinVerifier(),
      ]);
      if (attempts.lockedUntilMs !== null && current < attempts.lockedUntilMs) {
        setPinLockedUntilMs(attempts.lockedUntilMs);
        setAuthState('locked');
        return {
          ok: false,
          error: { code: 'tooManyAttempts', messageKey: 'tooManyAttempts' },
        };
      }

      if (!verifier || !session) {
        return {
          ok: false,
          error: { code: 'unknown', messageKey: 'unknown' },
        };
      }

      // Sync scrypt blocks the JS thread; callers should paint busy UI first.
      if (!verifyPin(pin, verifier)) {
        const failedAttempts = attempts.failedAttempts + 1;
        let lockedUntilMs: number | null = null;
        if (failedAttempts >= DEVELOPMENT_OFFLINE_ACCESS_POLICY.maxFailedPinAttempts) {
          lockedUntilMs = current + DEVELOPMENT_OFFLINE_ACCESS_POLICY.temporaryLockoutMs;
          setPinLockedUntilMs(lockedUntilMs);
        }
        await secureSession.savePinAttemptState({ failedAttempts, lockedUntilMs });
        return {
          ok: false,
          error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
        };
      }

      await secureSession.savePinAttemptState({ failedAttempts: 0, lockedUntilMs: null });
      setPinLockedUntilMs(null);
      const unlocked = { ...session, sessionState: 'ready' as const };
      await secureSession.saveSessionEnvelope(unlocked);
      setSession(unlocked);
      setAuthState(nextAuthStateAfterUnlock(unlocked));
      return { ok: true, redirectTo: resolveAuthenticatedHomeRoute(unlocked) };
    },
    [clock, secureSession, session, setAuthState, setSession, touchActivity],
  );

  const unlockWithBiometric: AuthContextValue['unlockWithBiometric'] = useCallback(async () => {
    touchActivity();
    if (!session?.biometricEnabled) {
      return {
        ok: false,
        error: { code: 'unknown', messageKey: 'unknown' },
      };
    }
    const result = await biometrics.authenticate(enBiometricPrompt());
    if (result === 'success') {
      const unlocked = { ...session, sessionState: 'ready' as const };
      await secureSession.saveSessionEnvelope(unlocked);
      setSession(unlocked);
      setAuthState(nextAuthStateAfterUnlock(unlocked));
      return { ok: true, redirectTo: resolveAuthenticatedHomeRoute(unlocked) };
    }
    if (result === 'cancel') {
      return {
        ok: false,
        error: { code: 'cancelled', messageKey: 'cancelled' },
      };
    }
    if (result === 'unavailable') {
      await secureSession.clearBiometricSessionHandle();
      if (session) {
        const updated = { ...session, biometricEnabled: false };
        await secureSession.saveSessionEnvelope(updated);
        setSession(updated);
      }
      setBiometricAvailability('invalidated');
    }
    return {
      ok: false,
      error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
    };
  }, [biometrics, secureSession, session, setAuthState, setSession, touchActivity]);

  const lock = useCallback(async () => {
    if (isDevAuthBypassEnabled()) {
      // Keep the temporary development session unlocked so PINless bypass stays usable.
      return;
    }
    clearAssistantConversation();
    clearCommunityRequestViews();
    if (session) {
      const locked = { ...session, sessionState: 'locked' as const };
      await secureSession.saveSessionEnvelope(locked);
      setSession(locked);
    }
    setAuthState('locked');
  }, [secureSession, session, setAuthState, setSession]);

  const signOut = useCallback(async () => {
    clearPendingPassportToken();
    clearAssistantConversation();
    clearCommunityRequestViews();
    await remoteAuth.signOut();
    await secureSession.clearAllAuthMaterial();
    await createSecureAccessTokenStore().clearAccessToken();
    preferredWorkspaceRef.current = null;
    setSetupSignInRole(null);
    setAccount(null);
    setSession(null);
    setPendingPin(null);
    setFirstTimeStep('none');
    setAuthState('signedOut');
  }, [remoteAuth, secureSession, setAuthState, setSession]);

  const changeAccount = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const requestPasswordReset = useCallback(
    async (loginIdentifier: string) => {
      await remoteAuth.requestPasswordReset(loginIdentifier);
      return 'recoverySubmitted';
    },
    [remoteAuth],
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const applyActiveWorkspace = useCallback(
    async (workspace: WorkspaceId) => {
      const currentSession = sessionRef.current;
      if (!currentSession) {
        return {
          ok: false as const,
          error: { code: 'unknown' as const, messageKey: 'unknown' },
        };
      }
      if (!currentSession.permittedWorkspaces.includes(workspace)) {
        return {
          ok: false as const,
          error: { code: 'roleMismatch' as const, messageKey: 'roleMismatch' },
        };
      }
      clearAssistantConversation();
      clearPendingPassportToken();
      clearCommunityRequestViews();
      const updated: LocalSessionEnvelope = {
        ...currentSession,
        activeWorkspace: workspace,
        role: workspaceRole(workspace),
        sessionState: 'ready',
      };
      await secureSession.saveSessionEnvelope(updated);
      setSession(updated);
      setAuthState('authenticated');
      touchActivity();
      return { ok: true as const };
    },
    [secureSession, setSession, setAuthState, touchActivity],
  );

  const selectActiveWorkspace = useCallback(
    async (workspace: WorkspaceId) => applyActiveWorkspace(workspace),
    [applyActiveWorkspace],
  );

  const switchWorkspace = useCallback(
    async (workspace: WorkspaceId) => {
      const currentSession = sessionRef.current;
      if (!currentSession) {
        return {
          ok: false as const,
          error: { code: 'unknown' as const, messageKey: 'unknown' },
        };
      }
      try {
        const auth = await createAdministrationApiClient().getSessionAuthorisation();
        const availableRoles = mapServerRolesToMobile(auth.roles);
        const permittedWorkspaces = auth.permittedWorkspaces.filter(isWorkspaceId);
        const refreshed: LocalSessionEnvelope = {
          ...currentSession,
          displayName: auth.displayName,
          availableRoles,
          permittedWorkspaces,
          organisationId: auth.organisationId,
          lastRemoteVerificationAt: new Date().toISOString(),
        };
        await secureSession.saveSessionEnvelope(refreshed);
        setSession(refreshed);
        if (!permittedWorkspaces.includes(workspace)) {
          return {
            ok: false as const,
            error: { code: 'roleMismatch' as const, messageKey: 'roleMismatch' },
          };
        }
      } catch {
        // Offline workspace switch falls back to cached session permissions.
      }
      return applyActiveWorkspace(workspace);
    },
    [applyActiveWorkspace, secureSession, setSession],
  );

  const workspaceSelectionRequired = authState === 'workspaceSelectionRequired';

  const beginOfflineWorkerActivation = useCallback(
    async (claims: SignedActivationClaimsV1) => {
      const nowIso = new Date(nowMs(clock)).toISOString();
      const nextAccount = authAccountFromActivationClaims(claims, nowIso);
      preferredWorkspaceRef.current = 'worker';
      setSetupSignInRole('worker');
      setAccount(nextAccount);
      setAuthState('firstTimeSetupRequired');
      setFirstTimeStep('facility');
      setLastError(null);
      touchActivity();
    },
    [clock, setAuthState, touchActivity],
  );

  const value = useMemo(
    (): AuthContextValue => ({
      ready,
      authState,
      account,
      session,
      firstTimeStep,
      setupSignInRole,
      pendingPin,
      lastError,
      biometricAvailability,
      pinLockedUntilMs,
      signIn,
      changePassword,
      confirmFacility,
      rejectFacility,
      setDraftPin,
      confirmPin,
      enableBiometrics,
      skipBiometrics,
      completeSetup,
      unlockWithPin,
      unlockWithBiometric,
      lock,
      signOut,
      changeAccount,
      requestPasswordReset,
      clearError,
      touchActivity,
      remoteProviderId: remoteAuth.id,
      selectActiveWorkspace,
      switchWorkspace,
      workspaceSelectionRequired,
      beginOfflineWorkerActivation,
    }),
    [
      account,
      authState,
      biometricAvailability,
      changeAccount,
      changePassword,
      clearError,
      completeSetup,
      confirmFacility,
      confirmPin,
      enableBiometrics,
      firstTimeStep,
      lastError,
      lock,
      pendingPin,
      pinLockedUntilMs,
      ready,
      rejectFacility,
      remoteAuth.id,
      requestPasswordReset,
      selectActiveWorkspace,
      session,
      setupSignInRole,
      setDraftPin,
      signIn,
      signOut,
      skipBiometrics,
      switchWorkspace,
      touchActivity,
      unlockWithBiometric,
      unlockWithPin,
      workspaceSelectionRequired,
      beginOfflineWorkerActivation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function enBiometricPrompt(): string {
  return 'Unlock NorthCare AI';
}

export function useAuthSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
