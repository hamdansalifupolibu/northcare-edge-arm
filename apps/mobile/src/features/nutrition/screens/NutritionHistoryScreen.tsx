import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import type { NutritionAssessment } from '../../../data/domain/entities/entities';
import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { AppButton, AppText, LoadingState } from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { NutritionAssessmentCard } from '../components/centre/NutritionAssessmentCard';
import { NutritionCentreEmptyState } from '../components/centre/NutritionCentreEmptyState';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { getNutritionClassificationStyle } from '../utils/nutritionClassification';

export function nutritionBasePath(clientId: string): string {
  return `/(worker)/clients/${clientId}/nutrition`;
}

type HistoryItem = {
  readonly assessment: NutritionAssessment;
  readonly interpretationCode: string | null;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function NutritionHistoryScreen() {
  const nutritionStrings = useNutritionStrings();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const db = useDatabase();
  const [items, setItems] = useState<readonly HistoryItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !clientId || !db.repositories) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const assessments = await services.getHistory(clientId);
      const client = await db.repositories.clients.findById(clientId);
      if (client) {
        setClientName(
          [client.givenName, client.familyName].filter(Boolean).join(' ') ||
            nutritionStrings.unknownClient,
        );
      }
      const enriched: HistoryItem[] = [];
      for (const assessment of assessments) {
        let interpretationCode: string | null = null;
        if (assessment.status === 'completed') {
          interpretationCode = await services.getInterpretationCode(assessment.id);
        }
        enriched.push({ assessment, interpretationCode });
      }
      setItems(enriched);
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, clientId, db.repositories, nutritionStrings.unknownClient]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <NutritionCentreShell testID="nutrition-history-screen">
        <LoadingState message={nutritionStrings.loading} />
      </NutritionCentreShell>
    );
  }

  return (
    <NutritionCentreShell testID="nutrition-history-screen">
      <NutritionCentreHeader
        title={nutritionStrings.historyTitle}
        subtitle={clientName || nutritionStrings.clientEntry}
        onBack={() => router.replace(asHref(`/(worker)/clients/${clientId}`))}
        backLabel={nutritionStrings.backToProfile}
      />

      {locked ? (
        <AppText variant="body" color="warning">
          {nutritionStrings.lockedBanner}
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <AppButton
        label={nutritionStrings.newAssessment}
        onPress={() => router.push(asHref(`${nutritionBasePath(clientId)}/start`))}
        disabled={locked}
        testID="nutrition-start-cta"
      />

      <View style={{ gap: 12 }}>
        {items.length === 0 ? (
          <NutritionCentreEmptyState
            title={nutritionStrings.historyTitle}
            body={nutritionStrings.historyEmpty}
            actionLabel={nutritionStrings.newAssessment}
            onAction={() => router.push(asHref(`${nutritionBasePath(clientId)}/start`))}
          />
        ) : (
          items.map((item, idx) => {
            const isDraft = item.assessment.status === 'draft';
            const classification = getNutritionClassificationStyle(
              item.interpretationCode,
              nutritionStrings,
            );
            return (
              <NutritionAssessmentCard
                key={item.assessment.id}
                title={nutritionStrings.assessmentNumber(items.length - idx)}
                subtitle={clientName || nutritionStrings.unknownClient}
                dateLabel={formatDate(item.assessment.assessmentDate)}
                classification={classification}
                isDraft={isDraft}
                draftLabel={nutritionStrings.draftStatus}
                superseded={Boolean(item.assessment.supersededById)}
                supersededLabel={
                  item.assessment.supersededById ? nutritionStrings.supersededLabel : undefined
                }
                onPress={() =>
                  router.push(asHref(`${nutritionBasePath(clientId)}/${item.assessment.id}`))
                }
                testID={`nutrition-history-${item.assessment.id}`}
              />
            );
          })
        )}
      </View>
    </NutritionCentreShell>
  );
}
