import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { colors, radii, spacing } from '../../../../theme';

type Props = {
  readonly sectionIndex: number;
  readonly sectionCount: number;
  readonly label: string;
};

export function NutritionSectionStepper({ sectionIndex, sectionCount, label }: Props) {
  return (
    <View style={styles.root} testID="nutrition-section-stepper">
      <AppText variant="caption" color="secondary" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.dots}>
        {Array.from({ length: sectionCount }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i + 1 === sectionIndex
                ? styles.dotActive
                : i + 1 < sectionIndex
                  ? styles.dotComplete
                  : styles.dotIdle,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: radii.pill,
    flex: 1,
  },
  dotActive: {
    backgroundColor: colors.primary,
    height: 8,
  },
  dotComplete: {
    backgroundColor: colors.primaryDark,
    opacity: 0.5,
  },
  dotIdle: {
    backgroundColor: colors.border,
  },
});
