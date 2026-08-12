import { useRouter } from 'expo-router';

import { AppButton } from '../../../../src/design-system/buttons/AppButton';
import { ScreenTitle } from '../../../../src/design-system/headers/ScreenTitle';
import { AppScreen } from '../../../../src/design-system/layout/AppScreen';
import { AppText } from '../../../../src/design-system/text/AppText';

export default function SyncConflictsRoute() {
  const router = useRouter();
  return (
    <AppScreen testID="sync-conflicts">
      <ScreenTitle>Sync conflicts</ScreenTitle>
      <AppText variant="body" color="secondary">
        Conflicting clinical records are kept for review. NorthCare AI never overwrites them automatically.
      </AppText>
      <AppText variant="caption" color="secondary">
        Connect to the approved sync service to load conflicts and choose an explicit resolution.
      </AppText>
      <AppButton label="Back to Sync Centre" onPress={() => router.back()} />
    </AppScreen>
  );
}
