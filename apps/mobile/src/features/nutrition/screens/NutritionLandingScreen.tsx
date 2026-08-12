import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import type { NutritionAssessment } from '../../../data/domain/entities/entities';
import { AppButton, AppText, LoadingState } from '../../../design-system';
import { LanguageToggleCompact } from '../../../i18n/LanguageToggle';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { NutritionAssessmentCard } from '../components/centre/NutritionAssessmentCard';
import { NutritionCentreEmptyState } from '../components/centre/NutritionCentreEmptyState';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { NutritionFilterSegment } from '../components/centre/NutritionFilterSegment';
import { NutritionStatRow } from '../components/centre/NutritionStatRow';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import {
  getNutritionClassificationStyle,
  matchesNutritionFilter,
  type NutritionListFilter,
} from '../utils/nutritionClassification';
import { useDatabase } from '../../../data/providers/DatabaseProvider';

type AssessmentWithClient = {
  readonly assessment: NutritionAssessment;
  readonly clientName: string;
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

function formatTime(timestamp: string | null): string {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timestamp;
  }
}

export function NutritionLandingScreen() {
  const nutritionStrings = useNutritionStrings();
  const router = useRouter();
  const { authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const db = useDatabase();
  const [items, setItems] = useState<readonly AssessmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NutritionListFilter>('all');
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !db.repositories) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const assessments = await services.listRecentAssessments(30);
      const withClients: AssessmentWithClient[] = [];
      for (const assessment of assessments) {
        let clientName = nutritionStrings.unknownClient;
        try {
          const client = await db.repositories.clients.findById(assessment.clientId);
          if (client) {
            clientName =
              [client.givenName, client.familyName].filter(Boolean).join(' ') ||
              nutritionStrings.unknownClient;
          }
        } catch {
          // ignore lookup errors
        }
        let interpretationCode: string | null = null;
        if (assessment.status === 'completed') {
          interpretationCode = await services.getInterpretationCode(assessment.id);
        }
        withClients.push({ assessment, clientName, interpretationCode });
      }
      setItems(withClients);
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, db.repositories, nutritionStrings.unknownClient]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        matchesNutritionFilter({
          filter,
          status: item.assessment.status,
          interpretationCode: item.interpretationCode,
        }),
      ),
    [items, filter],
  );

  const stats = useMemo(() => {
    let sam = 0;
    let mam = 0;
    let normal = 0;
    let draft = 0;
    for (const item of items) {
      if (item.assessment.status === 'draft') {
        draft += 1;
        continue;
      }
      if (item.interpretationCode === 'sam') sam += 1;
      else if (item.interpretationCode === 'mam') mam += 1;
      else if (item.interpretationCode === 'nutritionNormal') normal += 1;
    }
    return { total: items.length, sam, mam, normal, draft };
  }, [items]);

  const filterOptions = useMemo(
    () =>
      [
        { id: 'all' as const, label: nutritionStrings.filterAll },
        { id: 'sam' as const, label: nutritionStrings.filterSam },
        { id: 'mam' as const, label: nutritionStrings.filterMam },
        { id: 'adequate' as const, label: nutritionStrings.filterAdequate },
        { id: 'draft' as const, label: nutritionStrings.filterDraft },
      ] as const,
    [nutritionStrings],
  );

  if (loading) {
    return (
      <NutritionCentreShell testID="nutrition-landing-screen">
        <LoadingState message={nutritionStrings.loadingAssessments} />
      </NutritionCentreShell>
    );
  }

  return (
    <NutritionCentreShell testID="nutrition-landing-screen">
      <LanguageToggleCompact testID="nutrition-language-toggle" />
      <NutritionCentreHeader
        title={nutritionStrings.landingTitle}
        subtitle={nutritionStrings.centreSubtitle}
        statusLabel={nutritionStrings.centreSavedOnDevice}
        onBack={() => router.replace('/(worker)' as Href)}
        backLabel={nutritionStrings.centreBackLabel}
      />

      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <NutritionStatRow
        stats={[
          { label: nutritionStrings.statTotal, value: stats.total },
          { label: nutritionStrings.statSam, value: stats.sam, tone: 'danger' },
          { label: nutritionStrings.statMam, value: stats.mam, tone: 'warning' },
          { label: nutritionStrings.statAdequate, value: stats.normal, tone: 'success' },
          { label: nutritionStrings.statDraft, value: stats.draft },
        ]}
      />

      <AppButton
        label={nutritionStrings.newAssessment}
        onPress={() => router.push('/(worker)/clients?purpose=nutrition' as Href)}
        disabled={locked}
        testID="nutrition-new-assessment"
      />

      <NutritionFilterSegment options={filterOptions} value={filter} onChange={setFilter} />

      <View style={{ gap: 12 }}>
        <AppText variant="label">{nutritionStrings.recentAssessments}</AppText>
        {filteredItems.length === 0 ? (
          <NutritionCentreEmptyState
            title={nutritionStrings.landingTitle}
            body={nutritionStrings.landingEmpty}
            actionLabel={nutritionStrings.newAssessment}
            onAction={() => router.push('/(worker)/clients?purpose=nutrition' as Href)}
          />
        ) : (
          filteredItems.map((item, index) => {
            const isDraft = item.assessment.status === 'draft';
            const classification = getNutritionClassificationStyle(
              item.interpretationCode,
              nutritionStrings,
            );
            return (
              <NutritionAssessmentCard
                key={item.assessment.id}
                title={nutritionStrings.assessmentNumber(filteredItems.length - index)}
                subtitle={item.clientName}
                dateLabel={formatDate(item.assessment.assessmentDate)}
                timeLabel={item.assessment.completedAt ? formatTime(item.assessment.completedAt) : null}
                classification={classification}
                isDraft={isDraft}
                draftLabel={nutritionStrings.draftStatus}
                superseded={Boolean(item.assessment.supersededById)}
                supersededLabel={
                  item.assessment.supersededById ? nutritionStrings.supersededLabel : undefined
                }
                onPress={() =>
                  router.push(
                    `/(worker)/clients/${item.assessment.clientId}/nutrition/${item.assessment.id}` as Href,
                  )
                }
                testID={`nutrition-recent-${item.assessment.id}`}
              />
            );
          })
        )}
      </View>
    </NutritionCentreShell>
  );
}
