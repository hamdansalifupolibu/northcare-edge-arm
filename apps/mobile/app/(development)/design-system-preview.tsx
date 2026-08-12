import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '../../src/design-system/buttons/AppButton';
import { DesignSystemPreviewScreen } from '../../src/design-system';
import { useTranslation } from '../../src/i18n/LanguageProvider';
import { useLaunch } from '../../src/launch/LaunchProvider';
import { spacing } from '../../src/theme';

export default function DesignSystemPreviewRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { resetOnboardingForDevelopment } = useLaunch();

  return (
    <View style={{ flex: 1 }}>
      <DesignSystemPreviewScreen onClose={() => router.back()} />
      <View style={{ padding: spacing.md }}>
        <AppButton
          label={t.development.resetOnboarding}
          variant="tertiary"
          onPress={() => {
            void resetOnboardingForDevelopment().then(() => {
              router.replace('/(entry)/splash');
            });
          }}
          testID="dev-reset-onboarding"
        />
      </View>
    </View>
  );
}
