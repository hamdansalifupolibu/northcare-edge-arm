import { StyleSheet, View } from 'react-native';

import { AppCard } from '../../design-system/cards/AppCard';
import { AppText } from '../../design-system/text/AppText';
import { layout, radii, semanticColors, spacing } from '../../theme';

/**
 * Temporary code-based visual for onboarding screen 2.
 * Clean production photograph is not yet available.
 * Reference WebP with embedded chips is NOT used as a production hero.
 */
export function FrontlineWorkerHero() {
  return (
    <View
      style={styles.root}
      accessibilityRole="image"
      accessibilityLabel="Illustration representing frontline health worker mobile workflows"
      testID="frontline-worker-hero"
    >
      <View style={styles.iconCircle}>
        <AppText variant="headingMedium" color="inverse" align="center">
          HW
        </AppText>
      </View>
      <AppCard style={styles.card}>
        <AppText variant="label" color="action">
          Mobile workflow
        </AppText>
        <AppText variant="caption" color="secondary">
          Visit capture · Review · Referral support
        </AppText>
      </AppCard>
      <AppCard style={styles.cardMuted}>
        <AppText variant="caption" color="secondary">
          Temporary illustration — production photo pending
        </AppText>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    aspectRatio: 4 / 3,
    borderRadius: radii.image,
    backgroundColor: semanticColors.surface.muted,
    borderWidth: 1,
    borderColor: semanticColors.border.default,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  card: {
    gap: spacing.xs,
  },
  cardMuted: {
    backgroundColor: semanticColors.background.secondary,
  },
});
