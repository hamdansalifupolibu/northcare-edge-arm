import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import {
  AppButton,
  AppText,
  CheckboxField,
  LoadingState,
} from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { listVisibleSections } from '../../screening/engine/templateEngine';
import type { ScreeningQuestionDefinition } from '../../screening/content/types';
import {
  formatScreeningAnswerLine,
  type ScreeningAnswerDisplayStrings,
} from '../../screening/utils/formatScreeningAnswerDisplay';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { NutritionCorrectionBanner } from '../components/centre/NutritionCorrectionBanner';
import { NutritionTemplateSectionHeader } from '../components/centre/NutritionTemplateSectionHeader';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { nutritionBasePath } from './NutritionHistoryScreen';

type ReviewSection = {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly { readonly id: string; readonly label: string; readonly value: string }[];
};

export function NutritionReviewScreen() {
  const nutritionStrings = useNutritionStrings();
  const { clientId, assessmentId } = useLocalSearchParams<{
    clientId: string;
    assessmentId: string;
  }>();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const { colors, isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomplete, setIncomplete] = useState<readonly string[]>([]);
  const [sections, setSections] = useState<readonly ReviewSection[]>([]);
  const [isCorrection, setIsCorrection] = useState(false);
  const locked = authState === 'locked';

  const load = useCallback(async () => {
    if (!services || !assessmentId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const review = await services.reviewAssessment(assessmentId);
      if (!review) {
        setSections([]);
        return;
      }
      setIncomplete(review.incompleteRequired);
      setIsCorrection(Boolean(review.draft.assessment.supersedesId));

      const screening = services.getScreeningTemplate(review.draft.template);
      const visible = listVisibleSections(screening, review.draft.answers);
      const answerMap = new Map(review.draft.answers.map((a) => [a.questionId, a]));

      const displayStrings = toDisplayStrings(nutritionStrings);

      setSections(
        visible.map(({ section, questions }) => ({
          id: section.id,
          title: section.title,
          rows: questions.map((question) => {
            const answer = answerMap.get(question.id);
            const formatted = formatScreeningAnswerLine(
              question as ScreeningQuestionDefinition,
              answer?.state ?? 'unanswered',
              answer?.value,
              displayStrings,
            );
            return {
              id: question.id,
              label: formatted.label,
              value: formatted.value,
            };
          }),
        })),
      );
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, assessmentId, nutritionStrings]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const complete = async () => {
    if (!services || !account?.accountId || !assessmentId || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await services.completeAssessment({
        assessmentId,
        accountId: account.accountId,
        confirmed,
      });
      router.replace(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/summary`));
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  const incompleteBanner = useMemo(
    () => (incomplete.length > 0 ? nutritionStrings.reviewIncomplete(incomplete.length) : null),
    [incomplete.length, nutritionStrings],
  );

  if (loading) {
    return (
      <NutritionCentreShell testID="nutrition-review-screen">
        <LoadingState message={nutritionStrings.loading} />
      </NutritionCentreShell>
    );
  }

  return (
    <NutritionCentreShell testID="nutrition-review-screen">
      <NutritionCentreHeader
        title={nutritionStrings.reviewTitle}
        subtitle={nutritionStrings.reviewBody}
        onBack={() => router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/resume`))}
        backLabel={nutritionStrings.reviewBackToSections}
      />

      {isCorrection ? <NutritionCorrectionBanner message={nutritionStrings.correctionBanner} /> : null}

      {locked ? (
        <AppText variant="body" color="warning">
          {nutritionStrings.lockedBanner}
        </AppText>
      ) : null}

      {incompleteBanner ? (
        <View
          style={[
            styles.incompleteBox,
            {
              backgroundColor: colors.warningBackground,
              borderLeftColor: colors.warning,
            },
          ]}
        >
          <AppText variant="body" style={{ color: colors.warning, fontWeight: '700' }}>
            {incompleteBanner}
          </AppText>
        </View>
      ) : (
        <AppText variant="body" color="secondary">
          {nutritionStrings.reviewReady}
        </AppText>
      )}

      {sections.map((section) => (
        <View key={section.id} style={styles.sectionBlock}>
          <NutritionTemplateSectionHeader sectionId={section.id} title={section.title} />
          <View
            style={[
              styles.answerList,
              {
                backgroundColor: isDark ? colors.mutedSurface : colors.surface,
                borderColor: isDark ? colors.border : 'transparent',
                borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            {section.rows.map((row) => (
              <View
                key={row.id}
                style={[styles.answerRow, { borderBottomColor: colors.border }]}
              >
                <AppText variant="caption" color="secondary" style={styles.answerLabel}>
                  {row.label}
                </AppText>
                <AppText variant="body" color="primary" style={styles.answerValue}>
                  {row.value}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ))}

      <CheckboxField
        label={nutritionStrings.reviewConfirmLabel}
        checked={confirmed}
        onChange={setConfirmed}
      />

      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <AppButton
        label={nutritionStrings.reviewConfirmAction}
        onPress={() => void complete()}
        disabled={!confirmed || incomplete.length > 0 || busy || locked}
        testID="nutrition-review-complete"
      />
    </NutritionCentreShell>
  );
}

function toDisplayStrings(
  strings: ReturnType<typeof useNutritionStrings>,
): ScreeningAnswerDisplayStrings {
  return {
    yesLabel: strings.yesLabel,
    noLabel: strings.noLabel,
    unknownLabel: strings.unknownLabel,
    notAssessedLabel: strings.notAssessedLabel,
    notApplicableLabel: strings.notApplicableLabel,
    confirmedLabel: strings.confirmedLabel,
    reviewSectionSkipped: strings.reviewSectionSkipped,
    measurementMuac: strings.measurementMuac,
    measurementWeight: strings.measurementWeight,
    measurementHeight: strings.measurementHeight,
  };
}

const styles = StyleSheet.create({
  incompleteBox: {
    borderRadius: radii.md,
    padding: spacing.base,
    borderLeftWidth: 4,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  answerList: {
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.xs,
    elevation: 1,
  },
  answerRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});
