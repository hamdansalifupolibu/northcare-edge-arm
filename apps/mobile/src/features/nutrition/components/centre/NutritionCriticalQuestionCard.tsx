import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../../design-system';
import { colors, radii, spacing } from '../../../../theme';

type Props = {
  readonly title: string;
  readonly helpText?: string;
  readonly children: ReactNode;
};

export function NutritionCriticalQuestionCard({ title, helpText, children }: Props) {
  return (
    <View style={styles.card} testID="nutrition-critical-question-card">
      <View style={styles.alertRow}>
        <View style={styles.alertBadge}>
          <AppText variant="caption" color="inverse" style={styles.alertText}>
            CRITICAL
          </AppText>
        </View>
        <AppText variant="label" style={styles.title}>
          {title}
        </AppText>
      </View>
      {helpText ? (
        <AppText variant="caption" style={styles.help}>
          {helpText}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dangerBackground,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.danger,
    padding: spacing.base,
    gap: spacing.sm,
  },
  alertRow: {
    gap: spacing.xs,
  },
  alertBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  alertText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.danger,
    fontWeight: '700',
  },
  help: {
    color: colors.textSecondary,
  },
});
