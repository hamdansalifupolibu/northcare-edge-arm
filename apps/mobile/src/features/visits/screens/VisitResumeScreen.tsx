import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppScreen, AppText, LoadingState } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { useVisitServices } from '../hooks/useVisitServices';

export function VisitResumeScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const services = useVisitServices();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!services || !visitId) {
        return;
      }
      try {
        const draft = await services.resumeVisit(visitId);
        if (cancelled) {
          return;
        }
        if (!draft) {
          setError(t.visits.errors.missing);
          return;
        }
        const sectionId =
          draft.progressSectionId ?? draft.template.sections[0]?.id ?? 'section-a';
        router.replace(
          `/(worker)/clients/${clientId}/visits/${visitId}/screening/${sectionId}`,
        );
      } catch {
        if (!cancelled) {
          setError(t.visits.errors.loadFailed);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [services, visitId, clientId, router]);

  if (error) {
    return (
      <AppScreen>
        <AppText variant="body">{error}</AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <LoadingState message={t.visits.loading} />
    </AppScreen>
  );
}
