import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { NutritionGrowthEvaluationResult } from '../engine/growth/growthIndicatorEvaluator';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

type Props = {
  readonly evaluation: NutritionGrowthEvaluationResult | null;
};

export function NutritionGrowthIndicatorsPanel({ evaluation }: Props) {
  const nutritionStrings = useNutritionStrings();
  const { colors, isDark } = useThemeMode();

  const severityColor = (severity: string | null): string => {
    if (severity === 'severe') {
      return colors.danger;
    }
    if (severity === 'moderate') {
      return colors.warning;
    }
    return colors.success;
  };

  if (!evaluation || evaluation.indicators.length === 0) {
    return null;
  }

  const calculated = evaluation.indicators.filter((i) => i.status === 'calculated');

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
      testID="nutrition-growth-indicators"
    >
      <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
        {nutritionStrings.growthIndicatorsSection}
      </AppText>
      <AppText variant="caption" color="secondary">
        {nutritionStrings.growthIndicatorsSubtitle}
      </AppText>

      {calculated.map((indicator) => {
        const label = nutritionStrings.growthIndicatorLabels[indicator.indicatorId];
        const severityLabel =
          indicator.severity && indicator.severity !== 'adequate'
            ? nutritionStrings.growthSeverityLabels[indicator.severity]
            : nutritionStrings.growthSeverityLabels.adequate;

        return (
          <View key={indicator.indicatorId} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <AppText variant="body" color="primary">
                {label}
              </AppText>
              <AppText variant="caption" color="secondary">
                {nutritionStrings.growthZScoreLabel}: {indicator.zScore?.toFixed(2)}
              </AppText>
            </View>
            <AppText
              variant="label"
              style={{ color: severityColor(indicator.severity), fontSize: 13 }}
            >
              {severityLabel}
            </AppText>
          </View>
        );
      })}

      {evaluation.status === 'partial' ? (
        <AppText variant="caption" color="secondary">
          {nutritionStrings.growthPartialNote}
        </AppText>
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
  },
});
