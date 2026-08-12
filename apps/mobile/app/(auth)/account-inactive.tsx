import { useRouter } from 'expo-router';

import { AppStateView } from '../../src/design-system';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function AccountInactiveRoute() {
  const t = useTranslation();
  const router = useRouter();
  return (
    <AppStateView
      variant="unavailable"
      heading={t.auth.accountInactiveTitle}
      explanation={t.auth.accountInactiveBody}
      primaryActionLabel={t.auth.changeWorkspace}
      onPrimaryAction={() => router.replace('/(entry)/workspace-selection')}
      testID="account-inactive"
    />
  );
}
