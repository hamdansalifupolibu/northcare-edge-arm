import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { radii, semanticColors, spacing } from '../../../theme';

export type SdgChip = {
  readonly number: string;
  readonly label: string;
};

export type OnboardingSdgChipsProps = {
  readonly primary: readonly SdgChip[];
  readonly secondary?: SdgChip;
  readonly testID?: string;
};

const SDG_COLORS: Record<string, string> = {
  '2': '#DDA63A',
  '3': '#4C9F38',
  '5': '#FF3A21',
  '10': '#DD1367',
};

function SdgChipView({ chip, compact }: { readonly chip: SdgChip; readonly compact?: boolean }) {
  const swatch = SDG_COLORS[chip.number] ?? semanticColors.action.primary;

  return (
    <View style={[styles.chip, compact ? styles.chipCompact : null]}>
      <View style={[styles.badge, { backgroundColor: swatch }]}>
        <AppText variant="label" color="inverse" style={styles.badgeText}>
          {chip.number}
        </AppText>
      </View>
      <AppText variant={compact ? 'caption' : 'label'} color="inverse" style={styles.chipLabel}>
        {chip.label}
      </AppText>
    </View>
  );
}

export function OnboardingSdgChips({ primary, secondary, testID }: OnboardingSdgChipsProps) {
  return (
    <View style={styles.root} testID={testID} accessibilityRole="text">
      <View style={styles.primaryRow}>
        {primary.map((chip) => (
          <SdgChipView key={chip.number} chip={chip} />
        ))}
      </View>
      {secondary ? <SdgChipView chip={secondary} compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  primaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.md,
    gap: spacing.xs,
    minWidth: 92,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipCompact: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  badge: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  badgeText: {
    fontWeight: '700',
  },
  chipLabel: {
    textAlign: 'center',
  },
});
