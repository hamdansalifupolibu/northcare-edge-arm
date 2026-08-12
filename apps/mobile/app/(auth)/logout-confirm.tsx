import { useRouter } from 'expo-router';

import { AppButton } from '../../src/design-system/buttons/AppButton';
import { AppScreen } from '../../src/design-system/layout/AppScreen';
import { ScreenTitle } from '../../src/design-system/headers/ScreenTitle';
import { AppText } from '../../src/design-system/text/AppText';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function LogoutConfirmRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { signOut } = useAuthSession();

  return (
    <AppScreen testID="logout-confirm">
      <ScreenTitle>{t.auth.logoutTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">
        {t.auth.logoutBody}
      </AppText>
      <AppButton
        label={t.auth.logoutConfirm}
        variant="destructive"
        onPress={() => {
          void signOut().then(() => router.replace('/(entry)/workspace-selection'));
        }}
      />
      <AppButton label={t.auth.cancel} variant="tertiary" onPress={() => router.back()} />
    </AppScreen>
  );
}
