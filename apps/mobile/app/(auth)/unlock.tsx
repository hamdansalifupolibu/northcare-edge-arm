import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ImmersiveUnlockScreen } from '../../src/features/auth/components/ImmersiveUnlockScreen';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import type { AuthRole } from '../../src/features/auth/domain/types';
import { useTranslation } from '../../src/i18n/LanguageProvider';

/** Yield so React can paint the Unlocking… state before sync scrypt freezes the JS thread. */
function yieldForUiPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
      return;
    }
    setTimeout(resolve, 0);
  });
}

function resolveUnlockRole(session: {
  readonly role: AuthRole;
  readonly activeWorkspace: 'worker' | 'administration' | null;
}): AuthRole {
  if (session.activeWorkspace === 'administration') {
    return 'administrator';
  }
  if (session.activeWorkspace === 'worker') {
    return 'worker';
  }
  return session.role;
}

export default function UnlockRoute() {
  const t = useTranslation();
  const router = useRouter();
  const {
    session,
    unlockWithPin,
    unlockWithBiometric,
    biometricAvailability,
    pinLockedUntilMs,
    changeAccount,
    switchWorkspace,
  } = useAuthSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitInFlight = useRef(false);
  const biometricPromptedRef = useRef(false);

  useEffect(() => {
    if (pinLockedUntilMs === null) {
      return;
    }
    const remaining = pinLockedUntilMs - Date.now();
    if (remaining > 0) {
      router.replace('/(auth)/temporarily-locked');
    }
  }, [pinLockedUntilMs, router]);

  const submitPin = useCallback(
    async (value: string) => {
      if (busy || submitInFlight.current || value.length !== 6) {
        return;
      }
      submitInFlight.current = true;
      setError(null);
      setBusy(true);
      try {
        await yieldForUiPaint();
        const result = await unlockWithPin(value);
        setPin('');
        if (!result.ok) {
          setError(t.auth.unlockFailed);
          return;
        }
        router.replace((result.redirectTo ?? '/(worker)') as '/');
      } finally {
        setBusy(false);
        submitInFlight.current = false;
      }
    },
    [busy, router, t.auth.unlockFailed, unlockWithPin],
  );

  useEffect(() => {
    if (pin.length === 6) {
      void submitPin(pin);
    }
  }, [pin, submitPin]);

  const submitBiometric = useCallback(async () => {
    if (busy) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await yieldForUiPaint();
      const result = await unlockWithBiometric();
      if (result.ok) {
        router.replace((result.redirectTo ?? '/(worker)') as '/');
        return;
      }
      if (result.error?.code !== 'cancelled') {
        setError(t.auth.unlockFailed);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, router, t.auth.unlockFailed, unlockWithBiometric]);

  const biometricReady =
    biometricAvailability === 'enabled' || session?.biometricEnabled === true;

  useEffect(() => {
    if (!session || !biometricReady || busy || biometricPromptedRef.current) {
      return;
    }
    biometricPromptedRef.current = true;
    const timer = setTimeout(() => {
      void submitBiometric();
    }, 500);
    return () => clearTimeout(timer);
  }, [biometricReady, busy, session, submitBiometric]);

  if (!session) {
    return null;
  }

  const unlockRole = resolveUnlockRole(session);

  return (
    <ImmersiveUnlockScreen
      role={unlockRole}
      displayName={session.displayName}
      facilityName={session.facilityName}
      canSwitchWorkspace={session.permittedWorkspaces.length > 1}
      pin={pin}
      busy={busy}
      error={error}
      biometricAvailable={biometricReady}
      onPinChange={(value) => {
        if (error) {
          setError(null);
        }
        setPin(value);
      }}
      onBiometricPress={() => {
        void submitBiometric();
      }}
      onPasswordPress={() => {
        void changeAccount().then(() => router.replace('/(entry)/workspace-selection'));
      }}
      onSwitchWorkspace={() => {
        const nextWorkspace =
          session.activeWorkspace === 'worker' ? 'administration' : 'worker';
        void switchWorkspace(nextWorkspace).then((result) => {
          if (result.ok) {
            router.replace(nextWorkspace === 'administration' ? '/(admin)' : '/(worker)');
          }
        });
      }}
    />
  );
}
