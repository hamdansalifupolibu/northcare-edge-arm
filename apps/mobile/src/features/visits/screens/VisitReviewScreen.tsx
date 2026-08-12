import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useVisitServices } from '../hooks/useVisitServices';

type ReviewRow = {
  readonly id: string;
  readonly summary: string;
};

export function VisitReviewScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const services = useVisitServices();
  const [loading, setLoading] = useState(true);
  const [incomplete, setIncomplete] = useState<readonly string[]>([]);
  const [banner, setBanner] = useState('');
  const [rows, setRows] = useState<readonly ReviewRow[]>([]);

  const load = useCallback(async () => {
    if (!services || !visitId) {
      return;
    }
    setLoading(true);
    try {
      const review = await services.reviewScreening(visitId);
      if (!review) {
        setRows([]);
        return;
      }
      setBanner(review.draft.template.developmentBanner);
      setIncomplete(review.incompleteRequired);
      const labels = new Map<string, string>();
      for (const section of review.draft.template.sections) {
        for (const question of section.questions) {
          labels.set(question.id, question.label);
        }
      }
      setRows(
        review.draft.answers.map((answer) => {
          const label = labels.get(answer.questionId) ?? answer.questionId;
          return {
            id: answer.questionId,
            summary: `${label}: ${formatAnswerSummary(answer.state, answer.value)}`,
          };
        }),
      );
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

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={t.visits.loading} />
      </AppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="visit-review-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.visits.review.title}</ScreenTitle>
        <AppText variant="caption" color="warning">
          {banner}
        </AppText>
        <AppText variant="body">{t.visits.review.body}</AppText>
        {incomplete.length > 0 ? (
          <AppText variant="body" color="warning">
            {t.visits.review.incomplete(incomplete.length)}
          </AppText>
        ) : (
          <AppText variant="body" color="secondary">
            {t.visits.review.ready}
          </AppText>
        )}
        {rows.map((row) => (
          <AppText key={row.id} variant="caption" color="secondary">
            {row.summary}
          </AppText>
        ))}
        <AppButton
          label={t.visits.review.continueToComplete}
          onPress={() =>
            router.push(`/(worker)/clients/${clientId}/visits/${visitId}/complete`)
          }
          disabled={incomplete.length > 0}
          testID="visit-review-continue"
        />
        <AppButton
          label={t.visits.review.backToScreening}
          variant="secondary"
          onPress={() =>
            router.push(`/(worker)/clients/${clientId}/visits/${visitId}/resume`)
          }
        />
      </View>
    </ScrollableAppScreen>
  );
}

function formatAnswerSummary(
  state: string,
  value:
    | { kind: string; value?: unknown; values?: readonly string[] }
    | undefined,
): string {
  if (state !== 'answered') {
    return state;
  }
  if (!value) {
    return 'answered';
  }
  if (value.kind === 'boolean') {
    return value.value ? 'yes' : 'no';
  }
  if (value.kind === 'multipleOptions' && Array.isArray(value.values)) {
    return value.values.join(', ');
  }
  if (value.kind === 'acknowledgement') {
    return 'acknowledged';
  }
  if ('value' in value && value.value != null) {
    return String(value.value);
  }
  return 'answered';
}
