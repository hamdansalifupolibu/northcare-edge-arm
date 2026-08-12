import { View, Pressable, StyleSheet } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import type { NutritionAssessment } from '../../../data/domain/entities/entities';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

type Props = {
  readonly assessment: NutritionAssessment;
  readonly title?: string;
  readonly index?: number;
  readonly onPress: () => void;
};

function syncLabel(
  syncStatus: NutritionAssessment['syncStatus'],
  strings: ReturnType<typeof useNutritionStrings>,
): string {
  if (syncStatus === 'pendingUpdate' || syncStatus === 'pendingCreate') {
    return strings.syncWaitingForConnection;
  }
  return strings.syncSavedOnDevice;
}

function statusStyle(status: NutritionAssessment['status']) {
  if (status === 'completed') {
    return { bg: colors.successBackground, text: colors.success, label: 'Completed' };
  }
  if (status === 'draft') {
    return { bg: colors.warningBackground, text: colors.warning, label: 'Draft' };
  }
  return { bg: colors.mutedSurface, text: colors.textSecondary, label: status };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function NutritionHistoryItem({ assessment, title, index, onPress }: Props) {
  const nutritionStrings = useNutritionStrings();
  const style = statusStyle(assessment.status);
  const displayTitle = title ?? (index != null ? `Assessment ${index}` : (assessment.assessmentType ?? 'Assessment'));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
      testID={`nutrition-history-${assessment.id}`}
    >
      <View style={styles.header}>
        <AppText variant="label" style={{ flex: 1 }}>{displayTitle}</AppText>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <AppText variant="caption" style={{ color: style.text, fontWeight: '700', fontSize: 11 }}>
            {style.label}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" color="secondary">
        {formatDate(assessment.assessmentDate)}
      </AppText>
      <AppText variant="caption" color="secondary" style={{ fontSize: 11 }}>
        {syncLabel(assessment.syncStatus, nutritionStrings)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.base,
    gap: spacing.xs,
    minHeight: 48,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
});
