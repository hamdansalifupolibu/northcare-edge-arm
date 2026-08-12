import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { HeartPulseIcon } from './WorkerHomeIcons';

type Props = {
  readonly tip: string;
};

export function WorkerHomeHealthTipCard({ tip }: Props) {
  const t = useTranslation();
  const { colors, isDark } = useThemeMode();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.mutedSurface : themedMintSurface(colors, isDark),
          borderColor: isDark ? colors.border : '#C5E3DC',
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${t.workerHome.healthTipTitle}. ${tip}`}
      testID="worker-home-health-tip"
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
        <HeartPulseIcon size={24} />
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" style={[styles.title, { color: isDark ? colors.textPrimary : colors.primaryDark }]}>
          {t.workerHome.healthTipTitle}
        </AppText>
        <AppText variant="body" style={{ lineHeight: 22, color: colors.textPrimary }}>
          {tip}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.base,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
