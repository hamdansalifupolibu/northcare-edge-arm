import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ImmersivePinSetupScreen } from '../../src/features/auth/components/ImmersivePinSetupScreen';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function ConfirmPinRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { confirmPin } = useAuthSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submitInFlight = useRef(false);

  const handleComplete = useCallback(() => {
    if (loading || submitInFlight.current || pin.length !== 6) {
      return;
    }
    submitInFlight.current = true;
    setLoading(true);
    void confirmPin(pin).then((result) => {
      setPin('');
      setLoading(false);
      submitInFlight.current = false;
      if (!result.ok) {
        setError(t.auth.pinMismatch);
        return;
      }
      router.replace(
        result.next === 'complete'
          ? '/(auth)/setup-complete'
          : '/(auth)/biometric-setup',
      );
    });
  }, [confirmPin, loading, pin, router, t.auth.pinMismatch]);

  useEffect(() => {
    if (pin.length === 6 && !loading) {
      handleComplete();
    }
  }, [handleComplete, loading, pin]);

  return (
    <ImmersivePinSetupScreen
      testID="confirm-pin"
      title={t.auth.confirmPinTitle}
      body={t.auth.confirmPinBody}
      subtitle={t.auth.unlockPinSubtitle}
      pin={pin}
      error={error}
      loading={loading}
      continueLabel={loading ? t.auth.securingDevice : t.onboarding.continue}
      onPinChange={(value) => {
        setError(null);
        setPin(value);
      }}
      onContinue={handleComplete}
    />
  );
}
