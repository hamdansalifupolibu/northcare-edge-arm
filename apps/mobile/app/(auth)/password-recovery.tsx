import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AppButton } from '../../src/design-system/buttons/AppButton';
import { AppTextInput } from '../../src/design-system/forms/AppTextInput';
import { ScrollableAppScreen } from '../../src/design-system/layout/ScrollableAppScreen';
import { ScreenTitle } from '../../src/design-system/headers/ScreenTitle';
import { AppText } from '../../src/design-system/text/AppText';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function PasswordRecoveryRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { requestPasswordReset } = useAuthSession();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <ScrollableAppScreen testID="password-recovery">
      <ScreenTitle>{t.auth.recoveryTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">
        {t.auth.recoveryBody}
      </AppText>
      <AppTextInput
        label={t.auth.loginIdentifierLabel}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />
      {submitted ? (
        <>
          <AppText variant="body">{t.auth.recoverySubmitted}</AppText>
          <AppText variant="caption" color="secondary">
            {t.auth.recoveryContactAdmin}
          </AppText>
        </>
      ) : (
        <AppButton
          label={t.auth.recoverySubmit}
          onPress={() => {
            void requestPasswordReset(identifier).then(() => setSubmitted(true));
          }}
        />
      )}
      <AppButton label={t.auth.cancel} variant="tertiary" onPress={() => router.back()} />
    </ScrollableAppScreen>
  );
}
