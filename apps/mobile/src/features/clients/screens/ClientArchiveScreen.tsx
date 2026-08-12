import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  FormErrorText,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useClientServices } from '../hooks/useClientServices';

export function ClientArchiveScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const t = useTranslation();
  const services = useClientServices();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const confirm = async () => {
    if (!services || !session || !clientId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await services.archiveClient({ id: clientId, accountId: session.accountId });
      router.replace('/(worker)/clients');
    } catch {
      setError(t.clients.registration.saveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollableAppScreen testID="client-archive-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.clients.archive.title}</ScreenTitle>
        <AppText variant="body" color="secondary">
          {t.clients.archive.body}
        </AppText>
        {error ? <FormErrorText>{error}</FormErrorText> : null}
        <AppButton
          label={t.clients.archive.confirm}
          variant="destructive"
          loading={busy}
          onPress={() => {
            void confirm();
          }}
          testID="delete-confirm"
        />
        <AppButton
          label={t.clients.archive.cancel}
          variant="tertiary"
          onPress={() => router.back()}
        />
      </View>
    </ScrollableAppScreen>
  );
}
