import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppStateView } from '../../src/design-system';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function TemporarilyLockedRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { changeAccount, pinLockedUntilMs } = useAuthSession();
  const [stillLocked, setStillLocked] = useState(true);

  useEffect(() => {
    const update = () => {
      setStillLocked(pinLockedUntilMs !== null && Date.now() < pinLockedUntilMs);
    };
    update();
    if (pinLockedUntilMs === null) {
      return;
    }
    const remaining = Math.max(0, pinLockedUntilMs - Date.now());
    const timer = setTimeout(update, remaining + 50);
    return () => clearTimeout(timer);
  }, [pinLockedUntilMs]);

  return (
    <AppStateView
      variant="error"
      heading={t.auth.temporarilyLockedTitle}
      explanation={t.auth.temporarilyLockedBody}
      primaryActionLabel={stillLocked ? t.auth.usePasswordInstead : t.onboarding.continue}
      onPrimaryAction={() => {
        if (stillLocked) {
          void changeAccount().then(() => router.replace('/(entry)/workspace-selection'));
          return;
        }
        router.replace('/(auth)/unlock');
      }}
      testID="temporarily-locked"
    />
  );
}
