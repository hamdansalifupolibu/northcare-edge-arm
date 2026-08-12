import { View, StyleSheet } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import type { ColorPalette } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { NutritionGuidanceCard as NutritionGuidanceCardModel } from '../domain/types';

type Props = {
  readonly card: NutritionGuidanceCardModel;
  readonly interpretationCode?: string | null;
};

type UrgencyStyle = {
  readonly bg: string;
  readonly border: string;
  readonly badge: string;
  readonly label: string;
  readonly textColor: string;
};

function getUrgencyStyle(
  card: NutritionGuidanceCardModel,
  palette: ColorPalette,
  code?: string | null,
): UrgencyStyle {
  if (code === 'sam' || (card.priorityOrder === 1 && card.heading.toLowerCase().includes('urgent'))) {
    return {
      bg: palette.dangerBackground,
      border: palette.danger,
      badge: palette.danger,
      label: 'URGENT',
      textColor: palette.danger,
    };
  }
  if (code === 'mam' || card.heading.toLowerCase().includes('moderate')) {
    return {
      bg: palette.warningBackground,
      border: palette.warning,
      badge: palette.warning,
      label: 'MODERATE',
      textColor: palette.warning,
    };
  }
  return {
    bg: palette.successBackground,
    border: palette.success,
    badge: palette.success,
    label: 'NORMAL',
    textColor: palette.success,
  };
}

function splitIntoActions(text: string): string[] {
  const sentences = text
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.map((s) => (s.endsWith('.') ? s : `${s}.`));
}

export function NutritionGuidanceCard({ card, interpretationCode }: Props) {
  const { colors, isDark } = useThemeMode();
  const urgency = getUrgencyStyle(card, colors, interpretationCode);
  const actions = splitIntoActions(card.workerActionText);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: urgency.bg,
          borderLeftColor: urgency.border,
          borderColor: isDark ? colors.border : 'transparent',
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
          borderLeftWidth: 4,
        },
      ]}
      testID={`nutrition-guidance-${card.guidanceId}`}
    >
      <View style={[styles.badge, { backgroundColor: urgency.badge }]}>
        <AppText variant="caption" color="inverse" style={styles.badgeText}>
          {urgency.label}
        </AppText>
      </View>

      <AppText variant="label" style={[styles.heading, { color: urgency.textColor }]}>
        {card.heading}
      </AppText>

      <AppText variant="body" color="primary" style={styles.summary}>
        {card.body}
      </AppText>

      <View style={styles.section}>
        <AppText variant="caption" color="secondary" style={styles.sectionTitle}>
          WHAT TO DO:
        </AppText>
        {actions.map((action, i) => (
          <View key={i} style={styles.bulletRow}>
            <AppText variant="body" color="primary" style={styles.bullet}>
              {'\u2022'}
            </AppText>
            <AppText variant="body" color="primary" style={styles.bulletText}>
              {action}
            </AppText>
          </View>
        ))}
      </View>

      {card.caregiverFacingText ? (
        <View
          style={[
            styles.caregiverBox,
            {
              backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.6)',
              borderColor: isDark ? colors.border : 'transparent',
              borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <AppText variant="caption" color="secondary" style={styles.sectionTitle}>
            TELL THE CAREGIVER:
          </AppText>
          <AppText variant="body" color="primary" style={styles.caregiverText}>
            {'\u201C'}{card.caregiverFacingText}{'\u201D'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    marginTop: spacing.xs,
    gap: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.xs,
  },
  bullet: {
    marginRight: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  caregiverBox: {
    marginTop: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
  },
  caregiverText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
