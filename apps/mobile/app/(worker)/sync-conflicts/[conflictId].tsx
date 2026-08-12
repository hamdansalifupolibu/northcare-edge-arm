import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../../../src/design-system/buttons/AppButton';
import { ScreenTitle } from '../../../src/design-system/headers/ScreenTitle';
import { AppScreen } from '../../../src/design-system/layout/AppScreen';
import { AppText } from '../../../src/design-system/text/AppText';
import { useDatabase } from '../../../src/data/providers/DatabaseProvider';
import { createSecureAccessTokenStore } from '../../../src/features/sync/application/accessTokenStore';
import { createSyncTransport } from '../../../src/features/sync/transport/syncTransport';
import { useTranslation } from '../../../src/i18n/LanguageProvider';

export default function SyncConflictDetailRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { conflictId } = useLocalSearchParams<{ conflictId: string }>();
  const { repositories } = useDatabase();
  const resolve = async (state: 'resolved' | 'keptForReview', action: string) => {
    if (!repositories || !conflictId) return;
    await createSyncTransport(createSecureAccessTokenStore()).resolveConflict(conflictId, action as 'chooseServer' | 'keepForReview' | 'chooseLocal');
    await repositories.syncConflicts.resolve(conflictId, state, action);
    router.back();
  };
  return (
    <AppScreen testID="sync-conflict-detail">
      <ScreenTitle>{t.sync.conflictDetailTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">{t.sync.conflictResolutionNotice}</AppText>
      <AppButton label={t.sync.keepForReview} variant="secondary" onPress={() => { void resolve('keptForReview', 'keepForReview'); }} />
      <AppButton label={t.sync.chooseServer} variant="secondary" onPress={() => { void resolve('resolved', 'chooseServer'); }} />
      <AppButton label={t.sync.back} variant="tertiary" onPress={() => router.back()} />
    </AppScreen>
  );
}
