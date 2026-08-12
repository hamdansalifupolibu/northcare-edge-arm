import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import type { VisitDraft } from '../application/createVisitServices';
import { useVisitServices } from '../hooks/useVisitServices';

export function VisitStartScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const services = useVisitServices();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<VisitDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const detectDraft = useCallback(async () => {
    if (!services || !clientId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const history = await services.getClientVisitHistory(clientId);
      const open = history.find(
        (item) =>
          item.encounter.status === 'draft' || item.encounter.status === 'inProgress',
      );
      if (open) {
        const draft = await services.getVisitDraft(open.encounter.id);
        setExisting(draft);
      } else {
        setExisting(null);
      }
    } catch {
      setError(t.visits.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [services, clientId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void detectDraft();
    }, 0);
    return () => clearTimeout(timer);
  }, [detectDraft]);

  const startFresh = async () => {
    if (!services || !clientId || !session?.accountId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await services.startVisit({
        clientId,
        accountId: session.accountId,
      });
      const visitId = result.draft.encounter.id;
      const sectionId =
        result.draft.progressSectionId ?? result.draft.template.sections[0]?.id;
      router.replace(
        `/(worker)/clients/${clientId}/visits/${visitId}/screening/${sectionId}`,
      );
    } catch {
      setError(t.visits.errors.startFailed);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={t.visits.loading} />
      </AppScreen>
    );
  }

  if (existing) {
    return (
      <ScrollableAppScreen testID="visit-existing-draft">
        <View style={{ gap: spacing.base }}>
          <ScreenTitle>{t.visits.start.title}</ScreenTitle>
          <AppText variant="body">{t.visits.start.existingDraftBody}</AppText>
          <AppText variant="caption" color="secondary">
            {existing.template.developmentBanner}
          </AppText>
          <AppButton
            label={t.visits.start.resume}
            onPress={() =>
              router.push(
                `/(worker)/clients/${clientId}/visits/${existing.encounter.id}/resume`,
              )
            }
            testID="visit-resume"
          />
          <AppButton
            label={t.visits.start.reviewDraft}
            variant="secondary"
            onPress={() =>
              router.push(
                `/(worker)/clients/${clientId}/visits/${existing.encounter.id}/review`,
              )
            }
          />
          <AppButton
            label={t.visits.start.discard}
            variant="destructive"
            onPress={() =>
              router.push(
                `/(worker)/clients/${clientId}/visits/${existing.encounter.id}`,
              )
            }
          />
          <AppButton
            label={t.visits.backToProfile}
            variant="tertiary"
            onPress={() => router.replace(`/(worker)/clients/${clientId}`)}
          />
          <AppButton
            label={t.workerShell.goToHome}
            variant="tertiary"
            onPress={() => router.replace('/(worker)')}
            testID="visit-start-go-home"
          />
        </View>
      </ScrollableAppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="visit-start-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.visits.start.title}</ScreenTitle>
        <AppText variant="body">{t.visits.start.body}</AppText>
        <AppText variant="caption" color="secondary">
          {t.visits.start.syntheticNotice}
        </AppText>
        {error ? (
          <AppStateView variant="error" heading={t.visits.errors.heading} explanation={error} />
        ) : null}
        <AppButton
          label={t.visits.start.confirm}
          onPress={() => void startFresh()}
          disabled={busy}
          testID="visit-start-confirm"
        />
        <AppButton
          label={t.visits.backToProfile}
          variant="tertiary"
          onPress={() => router.replace(`/(worker)/clients/${clientId}`)}
        />
        <AppButton
          label={t.workerShell.goToHome}
          variant="tertiary"
          onPress={() => router.replace('/(worker)')}
          testID="visit-start-go-home"
        />
      </View>
    </ScrollableAppScreen>
  );
}
