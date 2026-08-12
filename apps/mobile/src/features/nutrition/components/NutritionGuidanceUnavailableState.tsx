import { View } from 'react-native';

import { AppStateView } from '../../../design-system';
import { useNutritionStrings } from '../hooks/useNutritionStrings';
import { NutritionMissingInformation } from './NutritionMissingInformation';

type Props = {
  readonly outcome: string;
  readonly missingInformation?: readonly string[];
};

export function NutritionGuidanceUnavailableState({ outcome, missingInformation = [] }: Props) {
  const nutritionStrings = useNutritionStrings();
  const heading =
    outcome === 'moreInformationRequired'
      ? nutritionStrings.moreInformationRequiredTitle
      : nutritionStrings.unavailableGuidanceTitle;
  const explanation =
    outcome === 'moreInformationRequired'
      ? nutritionStrings.moreInformationRequiredBody
      : nutritionStrings.unavailableGuidanceBody;

  return (
    <View testID="nutrition-guidance-unavailable">
      <AppStateView variant="empty" heading={heading} explanation={explanation} />
      {missingInformation.length > 0 ? (
        <NutritionMissingInformation items={missingInformation} />
      ) : null}
    </View>
  );
}
