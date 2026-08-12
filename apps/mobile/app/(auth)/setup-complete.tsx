import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import { SetupCompleteScreen } from '../../src/features/auth/components/SetupCompleteScreen';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function SetupCompleteRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { completeSetup } = useAuthSession();
  const [busy, setBusy] = useState(false);

  return (
    <SetupCompleteScreen
      testID="setup-complete"
      title={t.auth.setupCompleteTitle}
      body={t.auth.setupCompleteBody}
      readyTitle={t.auth.setupCompleteReadyTitle}
      readyBody={t.auth.setupCompleteReadyBody}
      continueLabel={t.auth.continueToApp}
      settingsHint={t.auth.setupCompleteSettingsHint}
      loading={busy}
      onContinue={() => {
        setBusy(true);
        void completeSetup()
          .then(({ redirectTo }) => {
            router.replace(redirectTo as Href);
          })
          .finally(() => setBusy(false));
      }}
    />
  );
}
