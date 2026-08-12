import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ReachEmptyIllustration } from './ReachCentreIcons';

type Props = {
  readonly heading: string;
  readonly explanation: string;
  readonly sandboxBadge: string;
  readonly ctaLabel: string;
  readonly onOpenSandbox: () => void;
  readonly testID?: string;
};

export function ReachCentreEmptyState({
  heading,
  explanation,
  sandboxBadge,
  ctaLabel,
  onOpenSandbox,
  testID,
}: Props) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View style={styles.root} testID={testID ?? 'reach-centre-empty-state'}>
      <ReachEmptyIllustration />
      <View style={styles.copy}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: semantic.status.warningBackground }]}>
            <AppText variant="caption" color="warning" style={styles.badgeText}>
              {sandboxBadge}
            </AppText>
          </View>
        </View>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary, textAlign: 'center' }}>
          {heading}
        </AppText>
        <AppText variant="caption" color="secondary" style={styles.explanation}>
          {explanation}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        onPress={onOpenSandbox}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: themeColors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        testID="reach-centre-empty-open-sandbox"
      >
        <AppText variant="bodyStrong" color="inverse">
          {ctaLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: {
    fontWeight: '700',
  },
  explanation: {
    textAlign: 'center',
  },
  cta: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});
