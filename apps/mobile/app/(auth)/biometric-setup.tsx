import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { BiometricSetupScreen } from '../../src/features/auth/components/BiometricSetupScreen';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function BiometricSetupRoute() {
  const t = useTranslation();
  const router = useRouter();
  const {
    biometricAvailability,
    enableBiometrics,
    skipBiometrics,
    firstTimeStep,
  } = useAuthSession();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (firstTimeStep === 'complete') {
      router.replace('/(auth)/setup-complete');
    }
  }, [firstTimeStep, router]);

  const canEnable =
    biometricAvailability === 'available' || biometricAvailability === 'enabled';

  const finish = async (action: 'enable' | 'skip'): Promise<void> => {
    setBusy(true);
    try {
      if (action === 'enable') {
        await enableBiometrics();
      } else {
        await skipBiometrics();
      }
      router.replace('/(auth)/setup-complete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BiometricSetupScreen
      testID="biometric-setup"
      title={t.auth.biometricTitle}
      body={t.auth.biometricBody}
      privateTitle={t.auth.biometricPrivateTitle}
      privateBody={t.auth.biometricPrivateBody}
      enableLabel={t.auth.biometricEnable}
      skipLabel={t.auth.biometricSkip}
      unavailableMessage={canEnable ? undefined : t.auth.biometricUnavailable}
      settingsHint={t.auth.biometricSettingsHint}
      loading={busy}
      loadingMessage={t.auth.biometricSettingUp}
      canEnable={canEnable}
      onEnable={() => void finish('enable')}
      onSkip={() => void finish('skip')}
      onBack={() => router.back()}
    />
  );
}
