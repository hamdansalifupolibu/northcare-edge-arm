import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  AppScreen,
  LoadingState,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { routeAfterSuccessfulSignIn } from '../domain/firstTimeSetupFlow';
import type { AuthRole } from '../domain/types';
import { useAuthSession } from '../providers/AuthSessionProvider';
import { mapSafeAuthError } from '../services/errorMapper';
import {
  loadRememberedLogin,
  saveRememberedLogin,
} from '../storage/rememberedLoginPreferences';
import { ImmersiveLoginScreen } from './ImmersiveLoginScreen';

export function LoginScreen({
  expectedRole,
}: {
  readonly expectedRole: AuthRole;
  readonly title?: string;
}) {
  const t = useTranslation();
  const router = useRouter();
  const { signIn, clearError, lastError } = useAuthSession();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberAccount, setRememberAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadRememberedLogin(expectedRole).then((stored) => {
      if (!active || !stored) {
        setPrefsLoaded(true);
        return;
      }
      if (stored.rememberAccount) {
        setLoginIdentifier(stored.loginIdentifier);
        setRememberAccount(true);
      }
      setPrefsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [expectedRole]);

  const onSubmit = async (): Promise<void> => {
    setLoading(true);
    clearError();
    const trimmedIdentifier = loginIdentifier.trim();
    const trimmedPassword = password.trim();
    const result = await signIn({
      loginIdentifier: trimmedIdentifier,
      password: trimmedPassword,
      expectedRole,
    });
    setPassword('');
    setLoading(false);

    if (result.ok) {
      await saveRememberedLogin(expectedRole, {
        loginIdentifier: trimmedIdentifier,
        rememberAccount,
      });
      router.replace(routeAfterSuccessfulSignIn(expectedRole) as never);
      return;
    }
    if (result.error?.code === 'passwordChangeRequired') {
      router.replace('/(auth)/password-change');
      return;
    }
    if (result.error?.code === 'roleMismatch') {
      router.replace('/(entry)/workspace-selection');
    }
  };

  if (!prefsLoaded) {
    return (
      <AppScreen testID="login-loading">
        <LoadingState message={t.splash.preparing} presentation="startup" />
      </AppScreen>
    );
  }

  return (
    <ImmersiveLoginScreen
      expectedRole={expectedRole}
      loginIdentifier={loginIdentifier}
      password={password}
      loading={loading}
      rememberAccount={rememberAccount}
      lastErrorMessage={
        lastError ? mapSafeAuthError(lastError, t.auth.errors) : null
      }
      onLoginIdentifierChange={setLoginIdentifier}
      onPasswordChange={setPassword}
      onRememberAccountChange={setRememberAccount}
      onSubmit={() => void onSubmit()}
    />
  );
}
