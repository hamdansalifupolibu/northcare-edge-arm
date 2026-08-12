import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { LoadingState } from '../../src/design-system';
import { isDevAuthBypassEnabled } from '../../src/features/auth/development/devAuthBypass';
import { isDevAlwaysShowOnboardingEnabled } from '../../src/features/onboarding/development/devAlwaysShowOnboarding';
import { resolveAuthenticatedHomeRoute } from '../../src/features/auth/navigation/postAuthNavigation';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { CustomSplash } from '../../src/features/splash/CustomSplash';
import { preloadOnboardingForSplash } from '../../src/features/onboarding/content/onboardingImagePreload';
import { useTranslation } from '../../src/i18n/LanguageProvider';
import { useLaunch } from '../../src/launch/LaunchProvider';
import { postSplashRoute } from '../../src/launch/launchState';

type SplashDestination =
  | '/(entry)/onboarding'
  | '/(entry)/workspace-selection'
  | '/(auth)/worker-login'
  | '/(auth)/admin-login'
  | '/(entry)/session-workspace'
  | '/(auth)/session-expired'
  | '/(auth)/account-inactive'
  | '/(auth)/unlock'
  | '/(admin)'
  | '/(worker)';

export default function SplashRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { ready, launchState, databaseReadiness } = useLaunch();
  const auth = useAuthSession();
  const bypassAuth = isDevAuthBypassEnabled();
  const devAlwaysOnboarding = isDevAlwaysShowOnboardingEnabled();
  const [destination, setDestination] = useState<SplashDestination | null>(null);
  const navigatedRef = useRef(false);

  const preparingMessage =
    databaseReadiness === 'opening'
      ? t.splash.openingDatabase
      : databaseReadiness === 'migrating'
        ? t.splash.applyingMigrations
        : t.splash.preparing;

  const devBypassFastStart = bypassAuth && !devAlwaysOnboarding;
  const bootstrapPending = devBypassFastStart
    ? !auth.ready
    : !ready || !auth.ready || launchState === 'preparing';

  useEffect(() => {
    if (bootstrapPending) {
      return;
    }
    void SplashScreen.hideAsync();
  }, [bootstrapPending]);

  useEffect(() => {
    if (bootstrapPending) {
      return;
    }
    void preloadOnboardingForSplash();
  }, [bootstrapPending]);

  const resolveDestination = useCallback((): SplashDestination => {
    if (devAlwaysOnboarding) {
      return '/(entry)/onboarding';
    }
    if (auth.authState === 'sessionExpired') {
      return '/(auth)/session-expired';
    }
    if (auth.authState === 'accessRevoked') {
      return '/(auth)/account-inactive';
    }
    if (bypassAuth) {
      if (auth.authState === 'workspaceSelectionRequired') {
        return '/(entry)/session-workspace';
      }
      if (auth.authState === 'authenticated' && auth.session) {
        return resolveAuthenticatedHomeRoute(auth.session) as SplashDestination;
      }
    }
    if (auth.authState === 'authenticated' && auth.session) {
      return auth.session.role === 'administrator' ? '/(admin)' : '/(worker)';
    }
    if (auth.authState === 'locked' || auth.session) {
      return '/(auth)/unlock';
    }
    return postSplashRoute(launchState) as SplashDestination;
  }, [
    auth.authState,
    auth.session,
    bypassAuth,
    devAlwaysOnboarding,
    launchState,
  ]);

  const goNext = useCallback(() => {
    if (navigatedRef.current || bootstrapPending) {
      return;
    }
    navigatedRef.current = true;
    const next = resolveDestination();
    setDestination(next);
    router.replace(next);
  }, [bootstrapPending, resolveDestination, router]);

  useEffect(() => {
    if (bootstrapPending) {
      navigatedRef.current = false;
      setDestination(null);
      return;
    }

    const timeout = setTimeout(() => {
      goNext();
    }, devAlwaysOnboarding ? 2200 : 4500);

    const fallback = setTimeout(() => {
      goNext();
    }, 8000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(fallback);
    };
  }, [bootstrapPending, devAlwaysOnboarding, goNext]);

  const shortened = useMemo(
    () =>
      launchState === 'workerAuthenticationRequired' ||
      launchState === 'administratorAuthenticationRequired' ||
      launchState === 'workspaceNotSelected' ||
      auth.authState === 'locked' ||
      auth.authState === 'authenticated' ||
      auth.authState === 'workspaceSelectionRequired' ||
      bypassAuth ||
      devAlwaysOnboarding,
    [auth.authState, bypassAuth, devAlwaysOnboarding, launchState],
  );

  if (destination) {
    return <Redirect href={destination} />;
  }

  if (bootstrapPending) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingState message={preparingMessage} presentation="startup" />
      </View>
    );
  }

  if (
    bypassAuth &&
    !devAlwaysOnboarding &&
    auth.authState === 'authenticated' &&
    auth.session
  ) {
    return <Redirect href={resolveDestination()} />;
  }

  return <CustomSplash onFinished={goNext} shortened={shortened} message={preparingMessage} />;
}
