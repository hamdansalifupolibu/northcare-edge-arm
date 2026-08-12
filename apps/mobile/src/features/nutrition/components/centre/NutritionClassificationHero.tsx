import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { colors, radii, shadows, spacing } from '../../../../theme';
import type { NutritionClassificationStyle } from '../../utils/nutritionClassification';

type Props = {
  readonly style: NutritionClassificationStyle;
  readonly sectionLabel: string;
  readonly muacDetail?: string | null;
  readonly testID?: string;
};

export function NutritionClassificationHero({
  style,
  sectionLabel,
  muacDetail,
  testID = 'nutrition-classification-hero',
}: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: style.bg,
          borderColor: style.border,
          borderLeftColor: style.border,
        },
        style.urgent ? styles.urgentCard : null,
      ]}
      testID={testID}
    >
      {style.urgent ? (
        <View style={[styles.urgentBadge, { backgroundColor: style.border }]}>
          <AppText variant="caption" color="inverse" style={styles.urgentText}>
            URGENT
          </AppText>
        </View>
      ) : null}
      <AppText variant="caption" style={[styles.sectionLabel, { color: style.textColor }]}>
        {sectionLabel}
      </AppText>
      <AppText variant="headingSmall" style={{ color: style.textColor, fontWeight: '800' }}>
        {style.label}
      </AppText>
      {muacDetail ? (
        <AppText variant="caption" color="secondary">
          {muacDetail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderLeftWidth: 5,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.md,
  },
  urgentCard: {
    borderWidth: 2,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginBottom: spacing.xxs,
  },
  urgentText: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
