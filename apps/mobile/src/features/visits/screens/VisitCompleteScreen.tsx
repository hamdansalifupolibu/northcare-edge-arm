import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  CheckboxField,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useVisitServices } from '../hooks/useVisitServices';

export function VisitCompleteScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const services = useVisitServices();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = async () => {
    if (!services || !session?.accountId || !visitId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await services.completeScreening({
        visitId,
        accountId: session.accountId,
        confirmed,
      });
      setDone(true);
      router.replace(`/(worker)/clients/${clientId}/visits/${visitId}/risk`);
    } catch {
      setError(t.visits.errors.completeFailed);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <ScrollableAppScreen testID="visit-complete-success">
        <View style={{ gap: spacing.base }}>
          <ScreenTitle>{t.visits.complete.successTitle}</ScreenTitle>
          <AppText variant="body">{t.visits.complete.successBody}</AppText>
          <AppText variant="caption" color="secondary">
            {t.visits.syncStatus.waitingForConnection}
          </AppText>
          <AppButton
            label="Continue to priority assessment"
            onPress={() =>
              router.replace(`/(worker)/clients/${clientId}/visits/${visitId}/risk`)
            }
            testID="visit-complete-to-risk"
          />
          <AppButton
            label={t.visits.backToProfile}
            variant="tertiary"
            onPress={() => router.replace(`/(worker)/clients/${clientId}`)}
            testID="visit-complete-done"
          />
        </View>
      </ScrollableAppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="visit-complete-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.visits.complete.title}</ScreenTitle>
        <AppText variant="body">{t.visits.complete.body}</AppText>
        <AppText variant="caption" color="secondary">
          After saving, you can review the priority assessment. Completion itself does not
          mean assessment normal, all clear, or no risk detected.
        </AppText>
        <CheckboxField
          label={t.visits.complete.confirmLabel}
          checked={confirmed}
          onChange={setConfirmed}
        />
        {error ? (
          <AppText variant="body" color="warning">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={t.visits.complete.confirm}
          onPress={() => void complete()}
          disabled={!confirmed || busy}
          testID="visit-complete-confirm"
        />
        <AppButton
          label={t.visits.complete.back}
          variant="tertiary"
          onPress={() =>
            router.push(`/(worker)/clients/${clientId}/visits/${visitId}/review`)
          }
        />
      </View>
    </ScrollableAppScreen>
  );
}
