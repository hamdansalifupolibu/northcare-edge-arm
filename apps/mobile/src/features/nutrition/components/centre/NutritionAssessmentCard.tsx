import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../design-system';
import { radii, shadows, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';
import type { NutritionClassificationStyle } from '../../utils/nutritionClassification';

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly dateLabel: string;
  readonly timeLabel?: string | null;
  readonly classification: NutritionClassificationStyle;
  readonly isDraft: boolean;
  readonly draftLabel: string;
  readonly superseded?: boolean;
  readonly supersededLabel?: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

export function NutritionAssessmentCard({
  title,
  subtitle,
  dateLabel,
  timeLabel,
  classification,
  isDraft,
  draftLabel,
  superseded = false,
  supersededLabel,
  onPress,
  testID,
}: Props) {
  const { colors, isDark } = useThemeMode();
  const badgeLabel = isDraft ? draftLabel : classification.shortLabel;
  const stripeColor = superseded ? colors.disabled : classification.border;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? colors.mutedSurface : colors.surface,
          borderLeftColor: stripeColor,
          borderColor: colors.border,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
          borderLeftWidth: 5,
          opacity: pressed ? 0.88 : superseded ? 0.65 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={styles.header}>
        <AppText variant="label" style={{ flex: 1, color: colors.textPrimary }}>
          {title}
        </AppText>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDraft
                ? colors.warningBackground
                : isDark
                  ? colors.surface
                  : classification.bg,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={{
              color: isDraft ? colors.warning : classification.textColor,
              fontWeight: '700',
              fontSize: 11,
            }}
          >
            {badgeLabel}
          </AppText>
        </View>
      </View>
      <AppText variant="body" style={{ color: colors.textPrimary }}>
        {subtitle}
      </AppText>
      {superseded && supersededLabel ? (
        <AppText variant="caption" color="secondary">
          {supersededLabel}
        </AppText>
      ) : null}
      <View style={styles.dateRow}>
        <AppText variant="caption" color="secondary">
          {dateLabel}
        </AppText>
        {timeLabel ? (
          <AppText variant="caption" color="secondary">
            {timeLabel}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.base,
    gap: spacing.xs,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
