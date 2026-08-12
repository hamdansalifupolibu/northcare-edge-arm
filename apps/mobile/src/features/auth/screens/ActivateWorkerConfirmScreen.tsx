import { useRouter } from 'expo-router';

import { AppButton, AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import {
  clearPendingActivationClaims,
  getPendingActivationClaims,
} from '../../administration/session/activationSessionStore';

export function ActivateWorkerConfirmScreen() {
  const t = useTranslation();
  const router = useRouter();
  const claims = getPendingActivationClaims();

  if (!claims) {
    return (
      <ScrollableAppScreen>
        <AppText>{t.administration.activation.missingClaims}</AppText>
        <AppButton
          label={t.administration.activation.scanAction}
          onPress={() => router.replace('/(auth)/activate-scan')}
        />
      </ScrollableAppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="activate-worker-confirm">
      <ScreenTitle>{t.administration.activation.confirmTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">
        {t.administration.activation.confirmBody}
      </AppText>
      <AppText variant="title">{claims.displayName}</AppText>
      <AppText variant="body">{claims.email}</AppText>
      <AppText variant="body" color="secondary">
        {t.administration.register.professionLabel}: {claims.professionLabel}
      </AppText>
      <AppText variant="body" color="secondary">
        {t.administration.register.facilityLabel}: {claims.facilityName}
      </AppText>
      <AppText variant="caption" color="secondary">
        {t.administration.activation.enrolledBy(claims.adminDisplayName)}
      </AppText>
      <AppButton
        label={t.onboarding.continue}
        onPress={() => router.push('/(auth)/activate-password')}
      />
      <AppButton
        label={t.auth.cancel}
        variant="tertiary"
        onPress={() => {
          clearPendingActivationClaims();
          router.replace('/(auth)/worker-login');
        }}
      />
    </ScrollableAppScreen>
  );
}
