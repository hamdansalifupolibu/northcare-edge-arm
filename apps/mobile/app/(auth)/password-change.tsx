import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton } from '../../src/design-system/buttons/AppButton';
import { ScrollableAppScreen } from '../../src/design-system/layout/ScrollableAppScreen';
import { ScreenTitle } from '../../src/design-system/headers/ScreenTitle';
import { AppText } from '../../src/design-system/text/AppText';
import { PasswordField } from '../../src/features/auth/components/PasswordField';
import { routeAfterSuccessfulSignIn } from '../../src/features/auth/domain/firstTimeSetupFlow';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { mapSafeAuthError } from '../../src/features/auth/services/errorMapper';
import { useTranslation } from '../../src/i18n/LanguageProvider';

function meetsPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export default function PasswordChangeRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { account, setupSignInRole, changePassword, lastError, clearError } = useAuthSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (result.ok && account) {
      router.replace(routeAfterSuccessfulSignIn(account.role, setupSignInRole) as never);
    }
  };

  return (
    <ScrollableAppScreen testID="password-change">
      <ScreenTitle>{t.auth.passwordChangeTitle}</ScreenTitle>
      <AppText variant="caption" color="secondary">
        {t.auth.passwordRequirements}
      </AppText>
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
    </ScrollableAppScreen>
  );
}
