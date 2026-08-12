import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { spacing } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { validateTemporaryPassword } from '../../administration/domain/policies';
import { useOfflineProvisioningServices } from '../../administration/hooks/useOfflineProvisioningServices';
import {
  clearPendingActivationClaims,
  getPendingActivationClaims,
} from '../../administration/session/activationSessionStore';
import { PasswordField } from '../components/PasswordField';
import { useAuthSession } from '../providers/AuthSessionProvider';

export function ActivateWorkerPasswordScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { beginOfflineWorkerActivation } = useAuthSession();
  const provisioning = useOfflineProvisioningServices();
  const claims = getPendingActivationClaims();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const onSubmit = async (): Promise<void> => {
    setError(null);
    if (!validateTemporaryPassword(password)) {
      setError(t.administration.register.validation.temporaryPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      await beginOfflineWorkerActivation(claims);
      if (provisioning) {
        await provisioning.markActivationNonceConsumed(claims.nonce);
      }
      clearPendingActivationClaims();
      router.replace('/(auth)/facility-confirmation');
    } catch {
      setError(t.auth.errors.unknown);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollableAppScreen testID="activate-worker-password">
      <ScreenTitle>{t.administration.activation.passwordTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">
        {t.administration.activation.passwordBody}
      </AppText>
      <View style={{ gap: spacing.md }}>
        <PasswordField
          label={t.auth.newPasswordLabel}
          value={password}
          onChangeText={setPassword}
          testID="activate-password-new"
        />
        <PasswordField
          label={t.auth.confirmPasswordLabel}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          testID="activate-password-confirm"
        />
        <AppText variant="caption" color="secondary">
          {t.auth.passwordRequirements}
        </AppText>
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton label={t.auth.savePassword} loading={loading} onPress={() => void onSubmit()} />
      </View>
    </ScrollableAppScreen>
  );
}
