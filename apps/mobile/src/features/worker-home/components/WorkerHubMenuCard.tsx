import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { colors, radii, shadows, spacing, themedFeatureIconBackground, type HexColor } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ChevronRightIcon } from './WorkerHomeIcons';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly iconBackgroundLight: HexColor;
  readonly renderIcon: () => ReactNode;
};

export function WorkerHubMenuCard({
  title,
  subtitle,
  onPress,
  testID,
  iconBackgroundLight,
  renderIcon,
}: Props) {
  const { colors: themeColors, isDark } = useThemeMode();
  const iconBackground = themedFeatureIconBackground(themeColors, isDark, iconBackgroundLight);
  const cardBackground = isDark ? themeColors.mutedSurface : themeColors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor: themeColors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.iconSquare, { backgroundColor: iconBackground }]}>{renderIcon()}</View>
      <View style={styles.copy}>
        <AppText variant="label" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <ChevronRightIcon color={themeColors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    ...shadows.sm,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '700',
  },
});
