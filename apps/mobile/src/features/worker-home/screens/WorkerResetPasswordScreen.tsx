import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '../../../design-system/buttons/AppButton';
import { AppText } from '../../../design-system/text/AppText';
import { PasswordField } from '../../auth/components/PasswordField';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapSafeAuthError } from '../../auth/services/errorMapper';
import { NutritionCentreShell } from '../../nutrition/components/centre/NutritionCentreShell';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../domain/workerNav';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { WorkerHubHeader } from '../components/WorkerHubHeader';

function meetsPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export function WorkerResetPasswordScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { changePassword, lastError, clearError, touchActivity } = useAuthSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const onSave = async (): Promise<void> => {
    clearError();
    setLocalError(null);
    if (newPassword !== confirmPassword) {
      setLocalError(t.auth.passwordMismatch);
      return;
    }
    if (!meetsPolicy(newPassword)) {
      setLocalError(t.auth.passwordTooWeak);
      return;
    }
    setLoading(true);
    const result = await changePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
    if (result.ok) {
      router.replace('/(worker)/more/settings');
    }
  };

  return (
    <NutritionCentreShell testID="worker-reset-password">
      <WorkerHubHeader
        title={t.workerHome.resetPasswordTitle}
        subtitle={t.auth.passwordRequirements}
        onBack={() => router.back()}
        showConnectivity={false}
      />

      <View style={{ gap: spacing.md }}>
        <PasswordField
          label={t.auth.currentPasswordLabel}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <PasswordField
          label={t.auth.newPasswordLabel}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <PasswordField
          label={t.auth.confirmPasswordLabel}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {localError || lastError ? (
          <AppText variant="body" color="urgent">
            {localError ?? (lastError ? mapSafeAuthError(lastError) : null)}
          </AppText>
        ) : null}
        <AppButton label={t.auth.savePassword} loading={loading} onPress={() => void onSave()} />
      </View>

      <View style={{ height: WORKER_BOTTOM_NAV_CLEARANCE }} />
    </NutritionCentreShell>
  );
}
