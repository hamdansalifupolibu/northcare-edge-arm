import 'react-native-gesture-handler';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getAppConfig } from '../src/config/appConfig';
import { DatabaseProvider } from '../src/data/providers/DatabaseProvider';
import { AppErrorBoundary } from '../src/error/AppErrorBoundary';
import { AuthSessionProvider } from '../src/features/auth/providers/AuthSessionProvider';
import { EdgeLabAutomationBridge } from '../src/features/edge-lab/components/EdgeLabAutomationBridge';
import { OfflineAiStage1AutomationBridge } from '../src/features/offline-ai/components/OfflineAiStage1AutomationBridge';
import { OfflineAiBundledProvisionBridge } from '../src/features/offline-ai/components/OfflineAiBundledProvisionBridge';
import { DemoSeedBridge } from '../src/data/fixtures/DemoSeedBridge';
import { ReminderNotificationBridge } from '../src/features/reminders/components/ReminderNotificationBridge';
import { ReferralDeepLinkBridge } from '../src/features/referrals/components/ReferralDeepLinkBridge';
import { SyncProvider } from '../src/features/sync/providers/SyncProvider';
import { LanguageDisclaimerProvider } from '../src/i18n/LanguageDisclaimerProvider';
import { LanguageProvider } from '../src/i18n/LanguageProvider';
import { LaunchProvider } from '../src/launch/LaunchProvider';
import { createLogger } from '../src/logging/logger';
import { plusJakartaFontMap } from '../src/theme';
import { ThemeModeProvider } from '../src/theme/ThemeModeProvider';
import { ThemedAppShell } from '../src/theme/ThemedAppShell';

void SplashScreen.preventAutoHideAsync();

const config = getAppConfig();
const logger = createLogger({ environment: config.appEnv });

export default function RootLayout() {
  const [boundaryKey, setBoundaryKey] = useState(0);
  const [fontsLoaded, fontError] = useFonts(plusJakartaFontMap);
  const [fontTimeoutReached, setFontTimeoutReached] = useState(false);
  const fontsReady = fontsLoaded || fontError != null || fontTimeoutReached;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFontTimeoutReached(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <AppErrorBoundary
        key={boundaryKey}
        logger={logger}
        diagnosticsEnabled={config.diagnosticsEnabled}
        onRetry={() => setBoundaryKey((value) => value + 1)}
      >
        <LanguageProvider>
          <ThemeModeProvider>
            <LanguageDisclaimerProvider>
              <ThemedAppShell>
                <DatabaseProvider>
                  <LaunchProvider fontsReady={fontsReady}>
                    <AuthSessionProvider>
                      <SyncProvider>
                        <ReferralDeepLinkBridge />
                        <ReminderNotificationBridge />
                        <OfflineAiStage1AutomationBridge />
                        <EdgeLabAutomationBridge />
                        <OfflineAiBundledProvisionBridge />
                        <DemoSeedBridge />
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            animation: 'fade',
                            contentStyle: { flex: 1 },
                          }}
                        >
                          <Stack.Screen name="index" />
                          <Stack.Screen name="(entry)" />
                          <Stack.Screen name="(auth)" />
                          <Stack.Screen name="(worker)" />
                          <Stack.Screen name="(admin)" />
                          <Stack.Screen name="(development)" />
                        </Stack>
                      </SyncProvider>
                    </AuthSessionProvider>
                  </LaunchProvider>
                </DatabaseProvider>
              </ThemedAppShell>
            </LanguageDisclaimerProvider>
          </ThemeModeProvider>
        </LanguageProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
