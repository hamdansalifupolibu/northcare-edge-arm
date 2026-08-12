import { StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { colors, radii, shadows, spacing } from '../../../theme';
import type { NutritionDraft } from '../application/createNutritionServices';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

type Props = {
  readonly draft: NutritionDraft;
  readonly onResume: () => void;
  readonly onReview: () => void;
  readonly onDiscard: () => void;
};

export function NutritionDraftCard({ draft, onResume, onReview, onDiscard }: Props) {
  const nutritionStrings = useNutritionStrings();
  return (
    <View style={styles.card} testID="nutrition-draft-card">
      <View style={styles.header}>
        <View style={styles.statusDot} />
        <AppText variant="caption" color="secondary" style={styles.statusLabel}>
          {nutritionStrings.draftStatus}
        </AppText>
      </View>
      <AppText variant="label" style={styles.title}>
        {draft.template.title}
      </AppText>
      <AppText variant="body" color="secondary">
        {nutritionStrings.existingDraftBody}
      </AppText>
      <View style={styles.actions}>
        <AppButton label={nutritionStrings.resumeDraft} onPress={onResume} testID="nutrition-resume" />
        <AppButton
          label={nutritionStrings.reviewDraft}
          variant="secondary"
          onPress={onReview}
          testID="nutrition-review-draft"
        />
        <AppButton
          label={nutritionStrings.discardDraft}
          variant="destructive"
          onPress={onDiscard}
          testID="nutrition-discard-draft"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderLeftWidth: 5,
    borderLeftColor: colors.warning,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.warning,
  },
  statusLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  title: {
    fontWeight: '800',
    fontSize: 16,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
