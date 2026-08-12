import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';

type Props = {
  readonly items: readonly string[];
};

export function NutritionMissingInformation({ items }: Props) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={{ gap: spacing.xs }} testID="nutrition-missing-information">
      <AppText variant="label">Missing information</AppText>
      {items.map((item) => (
        <AppText key={item} variant="caption" color="secondary">
          · {item}
        </AppText>
      ))}
    </View>
  );
}
