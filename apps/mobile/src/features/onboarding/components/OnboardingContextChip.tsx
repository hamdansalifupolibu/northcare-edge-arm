import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { radii, spacing } from '../../../theme';

export type OnboardingContextChipProps = {
  readonly label: string;
  readonly testID?: string;
};

export function OnboardingContextChip({ label, testID }: OnboardingContextChipProps) {
  return (
    <View style={styles.root} testID={testID} accessibilityRole="text">
      <AppText variant="label" color="inverse" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    opacity: 0.95,
  },
});
