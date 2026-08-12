import { useLocalSearchParams, useRouter } from 'expo-router';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';

import {
  AppButton,
  AppText,
  LoadingState,
} from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { NutritionDetails } from '../application/createNutritionServices';
import { mapNutritionServiceError } from '../application/createNutritionServices';
import { useNutritionServices } from '../hooks/useNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import type { AppStrings } from '../../../i18n/en';
import { nutritionBasePath } from './NutritionHistoryScreen';
import { NutritionGrowthIndicatorsPanel } from '../components/NutritionGrowthIndicatorsPanel';
import { NutritionIycfIndicatorsPanel } from '../components/NutritionIycfIndicatorsPanel';
import { NutritionCentreHeader } from '../components/centre/NutritionCentreHeader';
import { NutritionCentreShell } from '../components/centre/NutritionCentreShell';
import { NutritionClassificationHero } from '../components/centre/NutritionClassificationHero';
import { getNutritionClassificationStyle } from '../utils/nutritionClassification';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import type { ScreeningQuestionDefinition } from '../../screening/content/types';
import {
  formatScreeningAnswerValue,
  reviewQuestionLabel,
  type ScreeningAnswerDisplayStrings,
} from '../../screening/utils/formatScreeningAnswerDisplay';
import type { Measurement } from '../../../data/domain/entities/entities';

type NutritionUiStrings = AppStrings['nutrition'];

function toDisplayStrings(strings: NutritionUiStrings): ScreeningAnswerDisplayStrings {
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

function formatAnswerValue(
  answer: RecordedScreeningAnswer,
  question: ScreeningQuestionDefinition | undefined,
  strings: NutritionUiStrings,
): string {
  const displayStrings = toDisplayStrings(strings);
  if (!question) {
    if (answer.state === 'unknown') return strings.unknownLabel;
    if (answer.state === 'notAssessed') return strings.notAssessedLabel;
    return answer.state;
  }
  return formatScreeningAnswerValue(question, answer.state, answer.value, displayStrings);
}

function formatMeasurement(m: Measurement): string {
  return `${m.numericValue} ${m.unit}`;
}

function getMeasurementLabel(type: string, strings: NutritionUiStrings): string {
  switch (type) {
    case 'muac':
      return strings.measurementMuac;
    case 'weight':
      return strings.measurementWeight;
    case 'height':
      return strings.measurementHeight;
    default:
      return type;
  }
}

export function NutritionDetailsScreen() {
  const nutritionStrings = useNutritionStrings();
  const { clientId, assessmentId } = useLocalSearchParams<{
    clientId: string;
    assessmentId: string;
  }>();
  const router = useRouter();
  const { account, touchActivity } = useAuthSession();
  const services = useNutritionServices();
  const { colors, isDark } = useThemeMode();
  const [details, setDetails] = useState<NutritionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!services || !assessmentId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetails(await services.getDetails(assessmentId));
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setLoading(false);
    }
  }, [services, assessmentId]);

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
      <NutritionCentreShell testID="nutrition-details-screen">
        <LoadingState message={nutritionStrings.loading} />
      </NutritionCentreShell>
    );
  }

  if (!details) {
    return (
      <NutritionCentreShell>
        <AppText variant="body">{nutritionStrings.missingAssessment}</AppText>
      </NutritionCentreShell>
    );
  }

  const labels = new Map<string, string>();
  const questions = new Map<string, ScreeningQuestionDefinition>();
  const displayStrings = toDisplayStrings(nutritionStrings);
  for (const section of details.template?.sections ?? []) {
    for (const question of section.questions) {
      labels.set(question.id, reviewQuestionLabel(question, displayStrings));
      questions.set(question.id, question);
    }
  }

  const interpretationCode = details.referenceEvaluation?.interpretationCode ?? null;
  const classification = getNutritionClassificationStyle(
    interpretationCode,
    nutritionStrings,
    colors,
  );
  const muacDetail =
    details.referenceEvaluation?.derivedValue != null && details.referenceEvaluation.derivedUnit
      ? `${nutritionStrings.measurementMuac}: ${details.referenceEvaluation.derivedValue} ${details.referenceEvaluation.derivedUnit}`
      : null;

  const startCorrection = async () => {
    if (!services || !account?.accountId || editBusy) return;
    setEditBusy(true);
    setError(null);
    try {
      const result = await services.startCorrection({ assessmentId, accountId: account.accountId });
      router.push(asHref(`${nutritionBasePath(clientId)}/${result.assessmentId}/resume`));
    } catch (caught) {
      setError(mapNutritionServiceError(caught));
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!services || !account?.accountId) return;
    if (details.assessment.supersededById) {
      setError(nutritionStrings.deleteBlockedSuperseded);
      return;
    }
    Alert.alert(nutritionStrings.deleteConfirmTitle, nutritionStrings.deleteConfirmBody, [
      { text: nutritionStrings.deleteCancel, style: 'cancel' },
      {
        text: nutritionStrings.deleteConfirmAction,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleteBusy(true);
            try {
              await services.softDeleteAssessment({
                assessmentId,
                accountId: account.accountId,
                reason: 'Worker confirmed deletion',
                confirmed: true,
              });
              router.replace(asHref(`${nutritionBasePath(clientId)}`));
            } catch (caught) {
              setError(mapNutritionServiceError(caught));
            } finally {
              setDeleteBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <NutritionCentreShell testID="nutrition-details-screen">
      <NutritionCentreHeader
        title={nutritionStrings.detailsTitle}
        subtitle={`${details.assessment.assessmentDate} · ${nutritionStrings.completedLabel}`}
        onBack={() => router.replace(asHref(`${nutritionBasePath(clientId)}`))}
        backLabel={nutritionStrings.centreBackLabel}
      />

      {details.assessment.supersedesId ? (
        <AppText variant="caption" color="secondary">
          {nutritionStrings.supersedesLabel}
        </AppText>
      ) : null}
      {details.assessment.supersededById ? (
        <AppText variant="caption" color="secondary">
          {nutritionStrings.supersededLabel}
        </AppText>
      ) : null}

      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}

      <NutritionClassificationHero
        style={classification}
        sectionLabel={nutritionStrings.classificationSection}
        muacDetail={muacDetail}
      />

        <NutritionGrowthIndicatorsPanel evaluation={details.growthEvaluation} />
        <NutritionIycfIndicatorsPanel evaluation={details.iycfEvaluation} />

        {details.measurements.length > 0 ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? colors.mutedSurface : colors.surface,
                borderColor: colors.border,
                borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
              {nutritionStrings.measurementsSection}
            </AppText>
            {Array.from(
              details.measurements
                .reduce((map, m) => {
                  if (
                    !map.has(m.measurementType) ||
                    m.createdAt > map.get(m.measurementType)!.createdAt
                  ) {
                    map.set(m.measurementType, m);
                  }
                  return map;
                }, new Map<string, Measurement>())
                .values(),
            ).map((m) => (
              <View key={m.id} style={[styles.measurementRow, { borderBottomColor: colors.border }]}>
                <AppText variant="body" color="primary" style={styles.measurementLabel}>
                  {getMeasurementLabel(m.measurementType, nutritionStrings)}
                </AppText>
                <AppText variant="label" color="primary" style={styles.measurementValue}>
                  {formatMeasurement(m)}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.mutedSurface : colors.surface,
              borderColor: colors.border,
              borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            {nutritionStrings.responsesSection}
          </AppText>
          {details.answers
            .filter((a) => a.value?.kind !== 'acknowledgement')
            .map((answer) => (
              <View key={answer.questionId} style={[styles.answerRow, { borderBottomColor: colors.border }]}>
                <AppText variant="caption" color="secondary" style={styles.answerLabel}>
                  {labels.get(answer.questionId) ?? answer.questionId}
                </AppText>
                <AppText variant="body" color="primary" style={styles.answerValue}>
                  {formatAnswerValue(answer, questions.get(answer.questionId), nutritionStrings)}
                </AppText>
              </View>
            ))}
        </View>

        {details.assessment.status === 'completed' ? (
          <View style={{ gap: spacing.sm }}>
            <AppButton
              label={nutritionStrings.correctAssessmentButton}
              onPress={() => void startCorrection()}
              disabled={editBusy}
            />
            <AppButton
              label={nutritionStrings.deleteAssessmentButton}
              variant="tertiary"
              onPress={confirmDelete}
              disabled={deleteBusy}
            />
            <AppButton
              label={nutritionStrings.summaryViewGuidance}
              variant="secondary"
              onPress={() =>
                router.push(asHref(`${nutritionBasePath(clientId)}/${assessmentId}/guidance`))
              }
            />
          </View>
        ) : null}

        <AppButton
          label={nutritionStrings.backToHistory}
          variant="tertiary"
          onPress={() => router.replace(asHref(`${nutritionBasePath(clientId)}`))}
        />
    </NutritionCentreShell>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  editText: {
    fontWeight: '600',
  },
  classificationCard: {
    borderLeftWidth: 4,
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.xs,
  },
  classificationLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.sm,
    elevation: 1,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  measurementLabel: {
    fontSize: 14,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  answerRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  answerLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
