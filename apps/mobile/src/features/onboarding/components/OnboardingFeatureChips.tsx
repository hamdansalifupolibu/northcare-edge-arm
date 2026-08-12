import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { radii, spacing } from '../../../theme';

export type OnboardingFeatureChipsProps = {
  readonly labels: readonly string[];
  readonly testID?: string;
};

export function OnboardingFeatureChips({ labels, testID }: OnboardingFeatureChipsProps) {
  return (
    <View style={styles.root} testID={testID} accessibilityRole="text">
      {labels.map((label) => (
        <View key={label} style={styles.chip}>
          <AppText variant="label" color="inverse">
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
