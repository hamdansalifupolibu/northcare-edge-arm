import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import { useWorkerInspirationQuote } from '../hooks/useWorkerInspirationQuote';

export function WorkerInspirationCard() {
  const t = useTranslation();
  const quote = useWorkerInspirationQuote();

  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${t.workerHome.inspirationLabel}. ${quote.text}`}
      testID="worker-inspiration-card"
    >
      <AppText variant="caption" style={styles.label}>
        {t.workerHome.inspirationLabel}
      </AppText>
      <AppText variant="body" style={styles.quote}>
        {quote.text}
      </AppText>
      {quote.attribution ? (
        <AppText variant="caption" color="secondary">
          {quote.attribution}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.mutedSurface,
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  quote: {
    lineHeight: 22,
    color: colors.textPrimary,
  },
});
