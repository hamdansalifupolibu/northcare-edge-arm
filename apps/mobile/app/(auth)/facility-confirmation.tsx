import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppButton } from '../../src/design-system/buttons/AppButton';
import { ScrollableAppScreen } from '../../src/design-system/layout/ScrollableAppScreen';
import { AppText } from '../../src/design-system/text/AppText';
import { FacilityConfirmationScreen } from '../../src/features/auth/components/FacilityConfirmationScreen';
import { shouldSkipFacilityConfirmation } from '../../src/features/auth/domain/firstTimeSetupFlow';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function FacilityConfirmationRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { account, setupSignInRole, firstTimeStep, confirmFacility, rejectFacility } =
    useAuthSession();
  const [incorrect, setIncorrect] = useState(false);

  useEffect(() => {
    if (firstTimeStep === 'createPin') {
      router.replace('/(auth)/create-pin');
      return;
    }
    if (account && shouldSkipFacilityConfirmation(account.role, setupSignInRole)) {
      router.replace('/(auth)/create-pin');
    }
  }, [account, firstTimeStep, router, setupSignInRole]);

  if (!account) {
    return (
      <ScrollableAppScreen>
        <AppText>{t.auth.errors.unknown}</AppText>
        <AppButton
          label={t.auth.signIn}
          onPress={() => router.replace('/(entry)/workspace-selection')}
        />
      </ScrollableAppScreen>
    );
  }

  if (
    firstTimeStep !== 'facility' ||
    shouldSkipFacilityConfirmation(account.role, setupSignInRole)
  ) {
    return null;
  }

  const roleValue =
    account.role === 'administrator' ? t.auth.unlockAdminRole : t.auth.unlockWorkerRole;

  return (
    <FacilityConfirmationScreen
      account={account}
      title={t.auth.facilityTitle}
      subtitle={t.auth.facilitySubtitle}
      roleLabel={t.auth.roleLabel}
      roleValue={roleValue}
      facilityTypeLabel={t.auth.facilityTypeLabel}
      regionLabel={t.auth.facilityRegionLabel}
      confirmLabel={t.auth.facilityConfirm}
      incorrectLabel={t.auth.facilityIncorrect}
      incorrectBody={incorrect ? t.auth.facilityIncorrectBody : null}
      footerHint={t.auth.facilityFooterHint}
      onConfirm={() => {
        void confirmFacility().then(() => router.replace('/(auth)/create-pin'));
      }}
      onIncorrect={() => {
        setIncorrect(true);
        void rejectFacility();
      }}
    />
  );
}
