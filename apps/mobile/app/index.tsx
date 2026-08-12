import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { LoadingState } from '../src/design-system';
import { isDevAuthBypassEnabled } from '../src/features/auth/development/devAuthBypass';
import { resolveAuthenticatedHomeRoute } from '../src/features/auth/navigation/postAuthNavigation';
import { isDevAlwaysShowOnboardingEnabled } from '../src/features/onboarding/development/devAlwaysShowOnboarding';
import { preloadOnboardingForSplash } from '../src/features/onboarding/content/onboardingImagePreload';
import { useAuthSession } from '../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../src/i18n/LanguageProvider';
import { useLaunch } from '../src/launch/LaunchProvider';
import { useThemeMode } from '../src/theme/ThemeModeProvider';

/**
 * Root entry — bootstrap gate, then splash (or onboarding in development demo mode).
 */
export default function IndexRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { ready, launchState } = useLaunch();
  const auth = useAuthSession();
  const { semantic } = useThemeMode();
  const devAlwaysOnboarding = isDevAlwaysShowOnboardingEnabled();
  const navigatedRef = useRef(false);

  const devBypassFastStart =
    isDevAuthBypassEnabled() && !devAlwaysOnboarding;
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

  useEffect(() => {
    if (bootstrapPending || !devAlwaysOnboarding) {
      navigatedRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      if (navigatedRef.current) {
        return;
      }
      navigatedRef.current = true;
      router.replace('/(entry)/splash');
    }, 4000);

    return () => clearTimeout(timeout);
  }, [bootstrapPending, devAlwaysOnboarding, router]);

  useEffect(() => {
    if (!bootstrapPending) {
      return;
    }

    const escape = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace('/(entry)/splash');
      }
    }, 12000);

    return () => clearTimeout(escape);
  }, [bootstrapPending, router]);

  // Demo bypass: do not block the hackathon path on slow local storage.
  useEffect(() => {
    if (
      !isDevAuthBypassEnabled() ||
      devAlwaysOnboarding ||
      !auth.ready ||
      auth.authState !== 'authenticated' ||
      !auth.session
    ) {
      return;
    }

    const fastPath = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace(
          resolveAuthenticatedHomeRoute(auth.session!) as '/(worker)' | '/(admin)',
        );
      }
    }, 1500);

    return () => clearTimeout(fastPath);
  }, [
    auth.authState,
    auth.ready,
    auth.session,
    bootstrapPending,
    devAlwaysOnboarding,
    router,
  ]);

  if (bootstrapPending) {
    return (
      <View style={{ flex: 1, backgroundColor: semantic.background.primary }}>
        <LoadingState message={t.splash.preparing} presentation="startup" />
      </View>
    );
  }

  if (launchState === 'launchError') {
    return <Redirect href="/(entry)/launch-error" />;
  }

  if (
    isDevAuthBypassEnabled() &&
    !devAlwaysOnboarding &&
    auth.authState === 'authenticated' &&
    auth.session
  ) {
    return (
      <Redirect
        href={resolveAuthenticatedHomeRoute(auth.session) as '/(worker)' | '/(admin)'}
      />
    );
  }

  return <Redirect href="/(entry)/splash" />;
}
