import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useEffect, useState } from 'react';

import { AppScreen, AppText, LoadingState } from '../../../design-system';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { nutritionBasePath } from './NutritionHistoryScreen';

export function NutritionResumeScreen() {
  const nutritionStrings = useNutritionStrings();
const { clientId, assessmentId } = useLocalSearchParams<{
    clientId: string;
    assessmentId: string;
  }>();
  const router = useRouter();
  const services = useNutritionServices();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!services || !assessmentId) {
        return;
      }
      try {
        const draft = await services.getDraft(assessmentId);
        if (cancelled) {
          return;
        }
        if (!draft) {
          setError(nutritionStrings.missingAssessment);
          return;
        }
        const sectionId =
          draft.progressSectionId ?? draft.template.sections[0]?.id ?? 'section-feeding';
        router.replace(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/section/${sectionId}`,));
      } catch {
        if (!cancelled) {
          setError(nutritionStrings.missingAssessment);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [services, assessmentId, clientId, router]);

  if (error) {
    return (
      <AppScreen>
        <AppText variant="body">{error}</AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <LoadingState message={nutritionStrings.loading} />
    </AppScreen>
  );
}
