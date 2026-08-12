import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { colors, radii, spacing } from '../../../../theme';

type Props = {
  readonly message: string;
};

export function NutritionCorrectionBanner({ message }: Props) {
  return (
    <View style={styles.banner} testID="nutrition-correction-banner">
      <AppText variant="caption" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningBackground,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.base,
  },
  text: {
    color: colors.warning,
    fontWeight: '600',
  },
});
