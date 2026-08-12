import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { WorkerHomeTodayStats as TodayStats } from '../hooks/useWorkerHomeSummary';
import { AssessmentIcon, ClientsIcon, ReferralIcon } from './WorkerHomeIcons';

type Props = {
  readonly stats: TodayStats;
  readonly loading: boolean;
};

function StatColumn({
  value,
  label,
  hint,
  renderIcon,
  textColor,
}: {
  readonly value: number;
  readonly label: string;
  readonly hint: string;
  readonly renderIcon: () => ReactNode;
  readonly textColor: string;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.column} accessibilityRole="text" accessibilityLabel={`${value} ${label}. ${hint}`}>
      <View style={styles.iconWrap}>{renderIcon()}</View>
      <AppText variant="title" style={[styles.value, { color: textColor }]}>
        {value}
      </AppText>
      <AppText variant="caption" style={[styles.label, { color: colors.textPrimary }]}>
        {label}
      </AppText>
      <AppText variant="caption" color="secondary" style={styles.hint}>
        {hint}
      </AppText>
    </View>
  );
}

export function WorkerHomeTodayStats({ stats, loading }: Props) {
  const t = useTranslation();
  const { colors, isDark } = useThemeMode();

  return (
    <View style={styles.section} testID="worker-home-today-stats">
      <AppText variant="label" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t.workerHome.todayStatsTitle}
      </AppText>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.mutedSurface : colors.surface,
            borderColor: colors.border,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <StatColumn
          value={loading ? 0 : stats.clientsSeen}
          label={t.workerHome.todayClients}
          hint={t.workerHome.todayClientsHint}
          textColor={colors.textPrimary}
          renderIcon={() => <ClientsIcon size={20} />}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <StatColumn
          value={loading ? 0 : stats.assessmentsCompleted}
          label={t.workerHome.todayAssessments}
          hint={t.workerHome.todayAssessmentsHint}
          textColor={colors.textPrimary}
          renderIcon={() => <AssessmentIcon size={20} color={colors.warning} />}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <StatColumn
          value={loading ? 0 : stats.referralsCreated}
          label={t.workerHome.todayReferrals}
          hint={t.workerHome.todayReferralsHint}
          textColor={colors.textPrimary}
          renderIcon={() => <ReferralIcon size={20} color="#7C3AED" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  iconWrap: {
    marginBottom: spacing.xxs,
  },
  value: {
    fontWeight: '800',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    lineHeight: 16,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
