import { useRouter } from 'expo-router';

import { AppStateView } from '../../src/design-system';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function SessionExpiredRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { changeAccount } = useAuthSession();
  return (
    <AppStateView
      variant="error"
      heading={t.auth.sessionExpiredTitle}
      explanation={t.auth.sessionExpiredBody}
      primaryActionLabel={t.auth.signIn}
      onPrimaryAction={() => {
        void changeAccount().then(() => router.replace('/(entry)/workspace-selection'));
      }}
      testID="session-expired"
    />
  );
}
