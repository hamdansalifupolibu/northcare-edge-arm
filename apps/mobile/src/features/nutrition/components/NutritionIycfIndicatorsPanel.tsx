import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { NutritionIycfEvaluationResult } from '../engine/iycf/iycfEvaluator';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

type Props = {
  readonly evaluation: NutritionIycfEvaluationResult | null;
};

export function NutritionIycfIndicatorsPanel({ evaluation }: Props) {
  const nutritionStrings = useNutritionStrings();
  const { colors, isDark } = useThemeMode();

  const indicatorColor = (met: boolean | null | undefined): string => {
    if (met === true) {
      return colors.success;
    }
    if (met === false) {
      return colors.warning;
    }
    return colors.textSecondary;
  };

  if (!evaluation || evaluation.status === 'insufficientInformation') {
    return null;
  }

  if (evaluation.status === 'notApplicable' && evaluation.ageBand == null) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.mutedSurface : colors.surface,
          borderColor: colors.border,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
        },
      ]}
      testID="nutrition-iycf-indicators"
    >
      <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
        {nutritionStrings.iycfIndicatorsSection}
      </AppText>
      <AppText variant="caption" color="secondary">
        {nutritionStrings.iycfIndicatorsSubtitle}
      </AppText>

      {evaluation.ebf ? (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <AppText variant="body" color="primary">
            {nutritionStrings.iycfEbfLabel}
          </AppText>
          <AppText variant="label" style={{ color: indicatorColor(evaluation.ebf.exclusiveBreastfeeding) }}>
            {evaluation.ebf.exclusiveBreastfeeding == null
              ? nutritionStrings.classificationPending
              : evaluation.ebf.exclusiveBreastfeeding
                ? nutritionStrings.iycfMetLabel
                : nutritionStrings.iycfNotMetLabel}
          </AppText>
        </View>
      ) : null}

      {evaluation.mdd ? (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" color="primary">
              {nutritionStrings.iycfMddLabel}
            </AppText>
            <AppText variant="caption" color="secondary">
              {nutritionStrings.iycfMddScore(evaluation.mdd.score, evaluation.mdd.required)}
            </AppText>
          </View>
          <AppText variant="label" style={{ color: indicatorColor(evaluation.mdd.met) }}>
            {evaluation.mdd.met ? nutritionStrings.iycfMetLabel : nutritionStrings.iycfNotMetLabel}
          </AppText>
        </View>
      ) : null}

      {evaluation.mmf ? (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" color="primary">
              {nutritionStrings.iycfMmfLabel}
            </AppText>
            <AppText variant="caption" color="secondary">
              {nutritionStrings.iycfMmfDetail(
                evaluation.mmf.mealsPerDay,
                evaluation.mmf.requiredMeals,
              )}
            </AppText>
          </View>
          <AppText variant="label" style={{ color: indicatorColor(evaluation.mmf.met) }}>
            {evaluation.mmf.met ? nutritionStrings.iycfMetLabel : nutritionStrings.iycfNotMetLabel}
          </AppText>
        </View>
      ) : null}

      {evaluation.minimumAcceptableDiet != null ? (
        <View style={[styles.madRow, { borderLeftColor: indicatorColor(evaluation.minimumAcceptableDiet) }]}>
          <AppText variant="label" color="primary">
            {nutritionStrings.iycfMadLabel}
          </AppText>
          <AppText variant="body" style={{ color: indicatorColor(evaluation.minimumAcceptableDiet) }}>
            {evaluation.minimumAcceptableDiet
              ? nutritionStrings.iycfMadMet
              : nutritionStrings.iycfMadNotMet}
          </AppText>
        </View>
      ) : null}

      {evaluation.counselingNotes.length > 0 ? (
        <View style={styles.notesBlock}>
          {evaluation.counselingNotes.map((note) => (
            <AppText key={note} variant="caption" color="secondary">
              • {note}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  madRow: {
    borderLeftWidth: 4,
    paddingLeft: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  notesBlock: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
