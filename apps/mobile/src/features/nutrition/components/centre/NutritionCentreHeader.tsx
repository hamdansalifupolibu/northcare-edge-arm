import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../../design-system';
import { layout, radii, shadows, spacing } from '../../../../theme';
import { useThemeMode } from '../../../../theme/ThemeModeProvider';
import { ReachBackIcon } from '../../../community-requests/components/ReachCentreIcons';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
  readonly statusLabel?: string;
  readonly backLabel?: string;
  readonly onBack?: () => void;
};

export function NutritionCentreHeader({
  title,
  subtitle,
  statusLabel,
  backLabel = 'Back',
  onBack,
}: Props) {
  const { colors: themeColors, isDark } = useThemeMode();

  return (
    <View style={styles.root} testID="nutrition-centre-header">
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={onBack}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.85 : 1 }]}
            testID="nutrition-centre-back"
          >
            <ReachBackIcon color={themeColors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
        <View style={styles.logoWrap}>
          <NorthCareLogo variant="stacked" size="sm" testID="nutrition-centre-logo" />
        </View>
        {statusLabel ? (
          <View
            style={[
              styles.statusPill,
              {
                borderColor: themeColors.primary,
                backgroundColor: isDark ? themeColors.mutedSurface : themeColors.surface,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: themeColors.success }]} />
            <AppText
              variant="caption"
              style={[styles.statusText, { color: themeColors.textPrimary }]}
              numberOfLines={1}
            >
              {statusLabel}
            </AppText>
          </View>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>
      <View style={styles.titleBlock}>
        <AppText variant="headingLarge" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouchTarget,
  },
  iconButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    ...shadows.sm,
  },
  iconSpacer: {
    width: layout.minTouchTarget,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 110,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 11,
  },
  titleBlock: {
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '800',
  },
});
