import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ImmersivePinSetupScreen } from '../../src/features/auth/components/ImmersivePinSetupScreen';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function CreatePinRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { setDraftPin } = useAuthSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  const handleComplete = useCallback(() => {
    if (submitInFlight.current || pin.length !== 6) {
      return;
    }
    submitInFlight.current = true;
    const result = setDraftPin(pin);
    setPin('');
    submitInFlight.current = false;
    if (!result.ok) {
      setError(t.auth.pinLengthError);
      return;
    }
    router.push('/(auth)/confirm-pin');
  }, [pin, router, setDraftPin, t.auth.pinLengthError]);

  useEffect(() => {
    if (pin.length === 6) {
      handleComplete();
    }
  }, [pin, handleComplete]);

  return (
    <ImmersivePinSetupScreen
      testID="create-pin"
      title={t.auth.createPinTitle}
      body={t.auth.createPinBody}
      subtitle={t.auth.unlockPinTitle}
      pin={pin}
      error={error}
      continueLabel={t.onboarding.continue}
      onPinChange={(value) => {
        setError(null);
        setPin(value);
      }}
      onContinue={handleComplete}
    />
  );
}
