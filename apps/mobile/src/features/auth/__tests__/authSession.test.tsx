import React, { useLayoutEffect } from 'react';
import renderer, { act } from 'react-test-renderer';

import { createStubBiometricService } from '../biometrics/biometricService';
import { DEVELOPMENT_OFFLINE_ACCESS_POLICY } from '../domain/offlinePolicy';
import type { AuthAccount, AuthRole } from '../domain/types';
import { resolveAuthenticatedHomeRoute } from '../navigation/postAuthNavigation';
import { AuthSessionProvider, useAuthSession } from '../providers/AuthSessionProvider';
import { createDevelopmentAuthProvider } from '../services/DevelopmentAuthProvider';
import type { RemoteAuthProvider } from '../services/RemoteAuthProvider';
import { createMemorySecureSessionRepository } from '../storage/memorySecureSessionRepository';

type AuthApi = ReturnType<typeof useAuthSession>;

function Probe({ onUpdate }: { readonly onUpdate: (api: AuthApi) => void }) {
  const api = useAuthSession();
  useLayoutEffect(() => {
    onUpdate(api);
  }, [api, onUpdate]);
  return null;
}

async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function createDualRoleAuthProvider(): RemoteAuthProvider {
  const baseAccount: AuthAccount = {
    accountId: 'dual-role-001',
    displayName: 'Synthetic Dual Role',
    // Intentionally not the sign-in role — setup must use preferred workspace from expectedRole.
    role: 'worker',
    availableRoles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
  };

  return {
    id: 'development',
    getPasswordPolicy: () => ({
      minLength: 8,
      requireMixedCase: true,
      requireDigit: true,
    }),
    async signIn({ expectedRole }) {
      if (!baseAccount.availableRoles.includes(expectedRole)) {
        return {
          ok: false,
          error: { code: 'roleMismatch', messageKey: 'roleMismatch' },
        };
      }
      return {
        ok: true,
        account: {
          ...baseAccount,
          remoteAuthenticationTime: new Date().toISOString(),
        },
      };
    },
    async signOut() {},
    async changePassword() {
      return {
        ok: false,
        error: { code: 'unknown', messageKey: 'unknown' },
      };
    },
    async requestPasswordReset() {
      return { ok: true, genericMessageKey: 'recoverySubmitted' };
    },
    async getCurrentAccount() {
      return null;
    },
    async refreshAccountStatus() {
      return {
        ok: false,
        error: { code: 'unknown', messageKey: 'unknown' },
      };
    },
  };
}

async function mountAuth(options?: {
  readonly clock?: () => number;
  readonly biometrics?: ReturnType<typeof createStubBiometricService>;
  readonly secureSession?: ReturnType<typeof createMemorySecureSessionRepository>;
  readonly remoteAuth?: RemoteAuthProvider;
}): Promise<{
  readonly getApi: () => AuthApi;
  readonly secureSession: ReturnType<typeof createMemorySecureSessionRepository>;
  readonly unmount: () => void;
}> {
  const secureSession = options?.secureSession ?? createMemorySecureSessionRepository();
  const remoteAuth = options?.remoteAuth ?? createDevelopmentAuthProvider();
  const holder: { api: AuthApi | null } = { api: null };
  let tree: renderer.ReactTestRenderer | null = null;

  await act(async () => {
    tree = renderer.create(
      <AuthSessionProvider
        remoteAuth={remoteAuth}
        secureSession={secureSession}
        biometrics={options?.biometrics ?? createStubBiometricService('notAvailable')}
        clock={options?.clock}
      >
        <Probe
          onUpdate={(value) => {
            holder.api = value;
          }}
        />
      </AuthSessionProvider>,
    );
  });

  await flush();
  await flush();
  if (!holder.api?.ready) {
    throw new Error('Auth API not ready');
  }
  return {
    getApi: () => {
      if (!holder.api) {
        throw new Error('Auth API missing');
      }
      return holder.api;
    },
    secureSession,
    unmount: () => {
      act(() => {
        tree?.unmount();
      });
    },
  };
}

describe('AuthSessionProvider', () => {
  it('starts signed out when no local session exists', async () => {
    const { getApi, unmount } = await mountAuth();
    expect(getApi().ready).toBe(true);
    expect(getApi().authState).toBe('signedOut');
    expect(getApi().session).toBeNull();
    unmount();
  });

  it('hydrates once with default service factories without update-depth loop', async () => {
    const holder: { api: AuthApi | null } = { api: null };
    let tree: renderer.ReactTestRenderer | null = null;
    const previousError = console.error;
    const errors: string[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
      previousError(...args);
    };

    try {
      await act(async () => {
        tree = renderer.create(
          <AuthSessionProvider>
            <Probe
              onUpdate={(value) => {
                holder.api = value;
              }}
            />
          </AuthSessionProvider>,
        );
      });

      // Parent re-renders must not re-trigger hydrate via unstable default deps.
      for (let i = 0; i < 5; i += 1) {
        await act(async () => {
          tree?.update(
            <AuthSessionProvider>
              <Probe
                onUpdate={(value) => {
                  holder.api = value;
                }}
              />
            </AuthSessionProvider>,
          );
        });
        await flush();
      }

      expect(holder.api?.ready).toBe(true);
      expect(holder.api?.authState).toBe('signedOut');
      expect(errors.some((entry) => entry.includes('Maximum update depth exceeded'))).toBe(
        false,
      );
    } finally {
      console.error = previousError;
      act(() => {
        tree?.unmount();
      });
    }
  });

  it('completes worker first-time setup and unlocks with PIN', async () => {
    const { getApi, secureSession, unmount } = await mountAuth({
      biometrics: createStubBiometricService('notAvailable'),
    });

    await act(async () => {
      const result = await getApi().signIn({
        loginIdentifier: 'dev-worker-001',
        password: 'WorkerDemo1!',
        expectedRole: 'worker',
      });
      expect(result.ok).toBe(true);
    });
    await flush();
    expect(getApi().authState).toBe('firstTimeSetupRequired');
    expect(getApi().firstTimeStep).toBe('facility');

    await act(async () => {
      await getApi().confirmFacility();
    });
    await act(async () => {
      expect(getApi().setDraftPin('246810').ok).toBe(true);
    });
    await act(async () => {
      const confirmed = await getApi().confirmPin('246810');
      expect(confirmed.ok).toBe(true);
      expect(confirmed.next).toBe('complete');
    });
    await act(async () => {
      const completed = await getApi().completeSetup();
      expect(completed.redirectTo).toBe('/(worker)');
    });
    await flush();
    expect(getApi().authState).toBe('authenticated');
    expect(getApi().session?.activeWorkspace).toBe('worker');

    const storedVerifier = await secureSession.loadPinVerifier();
    expect(storedVerifier).not.toBeNull();
    expect(JSON.stringify(storedVerifier)).not.toContain('246810');

    await act(async () => {
      await getApi().lock();
    });
    await flush();
    expect(getApi().authState).toBe('locked');

    await act(async () => {
      const failed = await getApi().unlockWithPin('000000');
      expect(failed.ok).toBe(false);
    });
    expect((await secureSession.loadPinAttemptState()).failedAttempts).toBe(1);

    await act(async () => {
      const unlocked = await getApi().unlockWithPin('246810');
      expect(unlocked.ok).toBe(true);
    });
    await flush();
    expect(getApi().authState).toBe('authenticated');
    expect((await secureSession.loadPinAttemptState()).failedAttempts).toBe(0);
    unmount();
  });

  it('applies temporary lockout after max failed PIN attempts', async () => {
    let now = 1_000_000;
    const { getApi, unmount } = await mountAuth({ clock: () => now });

    await act(async () => {
      await getApi().signIn({
        loginIdentifier: 'dev-worker-001',
        password: 'WorkerDemo1!',
        expectedRole: 'worker',
      });
    });
    await flush();
    await act(async () => {
      await getApi().confirmFacility();
    });
    await act(async () => {
      getApi().setDraftPin('135790');
    });
    await act(async () => {
      await getApi().confirmPin('135790');
    });
    await act(async () => {
      await getApi().completeSetup();
      await getApi().lock();
    });
    await flush();

    for (let i = 0; i < DEVELOPMENT_OFFLINE_ACCESS_POLICY.maxFailedPinAttempts; i += 1) {
      await act(async () => {
        await getApi().unlockWithPin('000000');
      });
    }
    await flush();

    expect(getApi().pinLockedUntilMs).not.toBeNull();
    await act(async () => {
      const locked = await getApi().unlockWithPin('135790');
      expect(locked.ok).toBe(false);
      expect(locked.error?.code).toBe('tooManyAttempts');
    });

    now = (getApi().pinLockedUntilMs ?? now) + 1;
    await act(async () => {
      const unlocked = await getApi().unlockWithPin('135790');
      expect(unlocked.ok).toBe(true);
    });
    await flush();
    expect(getApi().authState).toBe('authenticated');
    unmount();
  });

  it('offers biometric setup when available and unlocks with biometrics', async () => {
    const { getApi, unmount } = await mountAuth({
      biometrics: createStubBiometricService('available'),
    });

    await act(async () => {
      await getApi().signIn({
        loginIdentifier: 'dev-worker-001',
        password: 'WorkerDemo1!',
        expectedRole: 'worker',
      });
    });
    await flush();
    await act(async () => {
      await getApi().confirmFacility();
    });
    await act(async () => {
      getApi().setDraftPin('112233');
    });
    await act(async () => {
      const next = await getApi().confirmPin('112233');
      expect(next.next).toBe('biometric');
    });
    await act(async () => {
      await getApi().enableBiometrics();
    });
    await flush();
    await act(async () => {
      await getApi().completeSetup();
    });
    await flush();
    expect(getApi().session?.biometricEnabled).toBe(true);

    await act(async () => {
      await getApi().lock();
    });
    await flush();
    await act(async () => {
      const unlocked = await getApi().unlockWithBiometric();
      expect(unlocked.ok).toBe(true);
    });
    await flush();
    expect(getApi().authState).toBe('authenticated');
    unmount();
  });

  it('clears biometric handle when biometric unlock becomes unavailable', async () => {
    const secureSession = createMemorySecureSessionRepository();
    const { getApi, unmount } = await mountAuth({
      secureSession,
      biometrics: createStubBiometricService('available'),
    });

    await act(async () => {
      await getApi().signIn({
        loginIdentifier: 'dev-worker-001',
        password: 'WorkerDemo1!',
        expectedRole: 'worker',
      });
    });
    await flush();
    await act(async () => {
      await getApi().confirmFacility();
    });
    await act(async () => {
      getApi().setDraftPin('445566');
    });
    await act(async () => {
      await getApi().confirmPin('445566');
    });
    await act(async () => {
      await getApi().enableBiometrics();
    });
    await flush();
    await act(async () => {
      await getApi().completeSetup();
      await getApi().lock();
    });
    await flush();
    unmount();

    const failingBiometrics = {
      async getAvailability() {
        return 'available' as const;
      },
      async authenticate() {
        return 'unavailable' as const;
      },
    };
    const holder: { api: AuthApi | null } = { api: null };
    let tree: renderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(
        <AuthSessionProvider
          remoteAuth={createDevelopmentAuthProvider()}
          secureSession={secureSession}
          biometrics={failingBiometrics}
        >
          <Probe
            onUpdate={(value) => {
              holder.api = value;
            }}
          />
        </AuthSessionProvider>,
      );
    });
    await flush();
    await flush();

    await act(async () => {
      const result = await holder.api!.unlockWithBiometric();
      expect(result.ok).toBe(false);
    });
    await expect(secureSession.loadBiometricEnabled()).resolves.toBe(false);
    act(() => {
      tree?.unmount();
    });
  });

  it('signs out and clears local auth material', async () => {
    const { getApi, secureSession, unmount } = await mountAuth();
    await act(async () => {
      await getApi().signIn({
        loginIdentifier: 'dev-admin-001',
        password: 'AdminDemo1!',
        expectedRole: 'administrator',
      });
    });
    await flush();
    await act(async () => {
      getApi().setDraftPin('998877');
    });
    await act(async () => {
      await getApi().confirmPin('998877');
    });
    await act(async () => {
      await getApi().completeSetup();
      await getApi().signOut();
    });
    await flush();
    expect(getApi().authState).toBe('signedOut');
    await expect(secureSession.loadSessionEnvelope()).resolves.toBeNull();
    await expect(secureSession.loadPinVerifier()).resolves.toBeNull();
    unmount();
  });

  it.each([
    ['worker', 'worker', '/(worker)'] as const,
    ['administrator', 'administration', '/(admin)'] as const,
  ])(
    'keeps dual-role launch choice (%s) through PIN setup',
    async (expectedRole: AuthRole, activeWorkspace, homeRoute) => {
      const { getApi, unmount } = await mountAuth({
        remoteAuth: createDualRoleAuthProvider(),
        biometrics: createStubBiometricService('notAvailable'),
      });

      await act(async () => {
        const result = await getApi().signIn({
          loginIdentifier: 'dual-role-001',
          password: 'unused',
          expectedRole,
        });
        expect(result.ok).toBe(true);
      });
      await flush();
      expect(getApi().firstTimeStep).toBe(
        expectedRole === 'administrator' ? 'createPin' : 'facility',
      );
      if (expectedRole === 'worker') {
        await act(async () => {
          await getApi().confirmFacility();
        });
      }
      await act(async () => {
        expect(getApi().setDraftPin('564738').ok).toBe(true);
      });
      await act(async () => {
        const confirmed = await getApi().confirmPin('564738');
        expect(confirmed.ok).toBe(true);
        expect(confirmed.next).toBe('complete');
      });
      await act(async () => {
        const completed = await getApi().completeSetup();
        expect(completed.redirectTo).toBe(homeRoute);
      });
      await flush();

      expect(getApi().authState).toBe('authenticated');
      expect(getApi().session?.activeWorkspace).toBe(activeWorkspace);
      expect(getApi().session?.permittedWorkspaces).toEqual([
        'worker',
        'administration',
      ]);
      expect(resolveAuthenticatedHomeRoute(getApi().session!)).toBe(homeRoute);
      unmount();
    },
  );

  it('completes administrator first-time setup without facility confirmation', async () => {
    const { getApi, unmount } = await mountAuth({
      biometrics: createStubBiometricService('notAvailable'),
    });

    await act(async () => {
      const result = await getApi().signIn({
        loginIdentifier: 'dev-admin-001',
        password: 'AdminDemo1!',
        expectedRole: 'administrator',
      });
      expect(result.ok).toBe(true);
    });
    await flush();
    expect(getApi().firstTimeStep).toBe('createPin');

    await act(async () => {
      expect(getApi().setDraftPin('135792').ok).toBe(true);
    });
    await act(async () => {
      const confirmed = await getApi().confirmPin('135792');
      expect(confirmed.ok).toBe(true);
      expect(confirmed.next).toBe('complete');
    });
    await act(async () => {
      const completed = await getApi().completeSetup();
      expect(completed.redirectTo).toBe('/(admin)');
    });
    await flush();
    expect(getApi().authState).toBe('authenticated');
    expect(getApi().session?.activeWorkspace).toBe('administration');
    unmount();
  });

  it('marks expired offline entitlement as sessionExpired', async () => {
    const secureSession = createMemorySecureSessionRepository();
    await secureSession.saveSessionEnvelope({
      schemaVersion: 1,
      accountId: 'dev-worker-001',
      role: 'worker',
      displayName: 'Synthetic Worker',
      facilityId: 'fac-dev-001',
      facilityName: 'Demo CHPS Compound',
      organisationId: 'org-dev-001',
      lastRemoteVerificationAt: '2020-01-01T00:00:00.000Z',
      offlineAccessPolicyVersion: 1,
      localSetupCompletedAt: '2020-01-01T00:00:00.000Z',
      biometricEnabled: false,
      sessionState: 'locked',
    });

    const { getApi, unmount } = await mountAuth({
      secureSession,
      clock: () => Date.parse('2026-08-02T12:00:00.000Z'),
    });
    expect(getApi().authState).toBe('sessionExpired');
    unmount();
  });
});
