import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
  StatusChip,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import type { VisitDetails } from '../application/createVisitServices';
import { mapVisitSyncPresentation } from '../domain/syncPresentation';
import { useVisitServices } from '../hooks/useVisitServices';
import { nutritionStrings } from '../../nutrition/i18n/nutritionStrings';

export function VisitDetailsScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const services = useVisitServices();
  const [details, setDetails] = useState<VisitDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!services || !visitId) {
      return;
    }
    setLoading(true);
    try {
      setDetails(await services.getVisitDetails(visitId));
    } finally {
      setLoading(false);
    }
  }, [services, visitId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const abandon = () => {
    if (!services || !session?.accountId || !visitId) {
      return;
    }
    Alert.alert(t.visits.details.abandonTitle, t.visits.details.abandonBody, [
      { text: t.visits.details.abandonCancel, style: 'cancel' },
      {
        text: t.visits.details.abandonConfirm,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await services.abandonVisit({ visitId, accountId: session.accountId });
            router.replace(`/(worker)/clients/${clientId}`);
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={t.visits.loading} />
      </AppScreen>
    );
  }

  if (!details) {
    return (
      <AppScreen>
        <AppText variant="body">{t.visits.errors.missing}</AppText>
      </AppScreen>
    );
  }

  const sync = mapVisitSyncPresentation(details.encounter.syncStatus);
  const open =
    details.encounter.status === 'draft' || details.encounter.status === 'inProgress';

  return (
    <ScrollableAppScreen testID="visit-details-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.visits.details.title}</ScreenTitle>
        <AppText variant="body">
          {t.visits.details.status}: {details.encounter.status}
        </AppText>
        <StatusChip label={t.visits.syncStatus[sync]} tone="pending" />
        {details.template ? (
          <AppText variant="caption" color="warning">
            {details.template.developmentBanner}
          </AppText>
        ) : null}
        <AppText variant="caption" color="secondary">
          {t.visits.details.answerCount(details.answers.length)}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.visits.details.measurementCount(details.measurements.length)}
        </AppText>
        {open ? (
          <>
            <AppButton
              label={t.voice.visitEntry}
              variant="secondary"
              onPress={() =>
                router.push(`/(worker)/clients/${clientId}/visits/${visitId}/voice`)
              }
              testID="visit-voice-entry"
            />
            <AppButton
              label={nutritionStrings.visitEntry}
              variant="secondary"
              onPress={() =>
                router.push(
                  `/(worker)/clients/${clientId}/nutrition/start?encounterId=${visitId}`,
                )
              }
              testID="visit-nutrition-entry"
            />
            <AppButton
              label={t.visits.start.resume}
              onPress={() =>
                router.push(`/(worker)/clients/${clientId}/visits/${visitId}/resume`)
              }
            />
            <AppButton
              label={t.visits.start.reviewDraft}
              variant="secondary"
              onPress={() =>
                router.push(`/(worker)/clients/${clientId}/visits/${visitId}/review`)
              }
            />
            <AppButton
              label={t.visits.details.abandonConfirm}
              variant="destructive"
              onPress={abandon}
              testID="visit-abandon"
            />
          </>
        ) : null}
        {details.encounter.status === 'completed' ? (
          <>
            <AppButton
              label="Open priority assessment"
              onPress={() =>
                router.push(`/(worker)/clients/${clientId}/visits/${visitId}/risk`)
              }
              testID="visit-open-risk"
            />
            <AppButton
              label="Priority history"
              variant="secondary"
              onPress={() =>
                router.push(
                  `/(worker)/clients/${clientId}/visits/${visitId}/risk/history`,
                )
              }
            />
          </>
        ) : null}
        <AppButton
          label={t.reminders.profileEntry}
          variant="secondary"
          onPress={() =>
            router.push(
              `/(worker)/more/reminders/create?clientId=${clientId}&visitId=${visitId}` as import('expo-router').Href,
            )
          }
          testID="visit-create-reminder"
        />
        <AppButton
          label={t.visits.backToProfile}
          variant="tertiary"
          onPress={() => router.replace(`/(worker)/clients/${clientId}`)}
        />
      </View>
    </ScrollableAppScreen>
  );
}
