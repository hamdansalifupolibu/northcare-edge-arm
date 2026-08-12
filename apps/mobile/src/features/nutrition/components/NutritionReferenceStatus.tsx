import { View } from 'react-native';

import { AppText, StatusChip } from '../../../design-system';
import { spacing } from '../../../theme';
import type { NutritionReferenceEvaluationResult } from '../domain/types';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { NutritionMissingInformation } from './NutritionMissingInformation';

type Props = {
  readonly evaluation: NutritionReferenceEvaluationResult | null;
};

export function NutritionReferenceStatus({ evaluation }: Props) {
  const nutritionStrings = useNutritionStrings();
  if (!evaluation) {
    return (
      <AppText variant="body" color="secondary">
        {nutritionStrings.unavailableInterpretationBody}
      </AppText>
    );
  }

  const label =
    nutritionStrings.referenceStatus[evaluation.status] ?? nutritionStrings.unavailableInterpretationTitle;

  return (
    <View style={{ gap: spacing.sm }} testID="nutrition-reference-status">
      <StatusChip
        label={label}
        tone={evaluation.status === 'calculated' ? 'neutral' : 'pending'}
      />
      {evaluation.interpretationCode ? (
        <AppText variant="caption" color="secondary">
          Code: {evaluation.interpretationCode}
        </AppText>
      ) : null}
      {evaluation.derivedValue != null && evaluation.derivedUnit ? (
        <AppText variant="caption" color="secondary">
          Derived: {evaluation.derivedValue} {evaluation.derivedUnit}
        </AppText>
      ) : null}
      {evaluation.missingInformation.length > 0 ? (
        <NutritionMissingInformation items={evaluation.missingInformation} />
      ) : null}
    </View>
  );
}
