import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppButton } from '../../src/design-system/buttons/AppButton';
import { ScreenTitle } from '../../src/design-system/headers/ScreenTitle';
import { AppScreen } from '../../src/design-system/layout/AppScreen';
import { AppText } from '../../src/design-system/text/AppText';
import { useDatabase } from '../../src/data/providers/DatabaseProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';

type Conflict = { readonly id: string; readonly entityType: string; readonly conflictClass: string };

export default function SyncConflictsRoute() {
  const t = useTranslation();
  const router = useRouter();
  const { repositories } = useDatabase();
  const [conflicts, setConflicts] = useState<readonly Conflict[]>([]);
  useEffect(() => {
    if (repositories) void repositories.syncConflicts.listOpen().then(setConflicts);
  }, [repositories]);
  return (
    <AppScreen testID="sync-conflicts">
      <ScreenTitle>{t.sync.conflictsTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">{t.sync.conflictsBody}</AppText>
      {conflicts.map((conflict) => (
        <AppButton key={conflict.id} label={`${conflict.entityType} · ${conflict.conflictClass}`} variant="secondary"
          onPress={() => router.push({ pathname: '/(worker)/sync-conflicts/[conflictId]', params: { conflictId: conflict.id } })} />
      ))}
      {!conflicts.length ? <AppText variant="caption" color="secondary">{t.sync.noConflicts}</AppText> : null}
      <AppButton label={t.sync.back} onPress={() => router.back()} />
    </AppScreen>
  );
}
