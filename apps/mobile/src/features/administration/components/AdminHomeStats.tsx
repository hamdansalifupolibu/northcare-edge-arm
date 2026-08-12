import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { InactiveIcon, PendingIcon, WorkersStatIcon } from './AdminHomeIcons';

type Props = {
  readonly workerCount: number;
  readonly pendingFirstLoginCount: number;
  readonly inactiveWorkerCount: number;
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
    <View
      style={styles.column}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}. ${hint}`}
    >
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

export function AdminHomeStats({
  workerCount,
  pendingFirstLoginCount,
  inactiveWorkerCount,
  loading,
}: Props) {
  const t = useTranslation();
  const { colors } = useThemeMode();

  return (
    <View style={styles.section} testID="admin-home-stats">
      <AppText variant="label" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t.adminShell.statsTitle}
      </AppText>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <StatColumn
          value={loading ? 0 : workerCount}
          label={t.adminShell.statWorkers}
          hint={t.adminShell.statWorkersHint}
          textColor={colors.textPrimary}
          renderIcon={() => <WorkersStatIcon />}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <StatColumn
          value={loading ? 0 : pendingFirstLoginCount}
          label={t.adminShell.statPending}
          hint={t.adminShell.statPendingHint}
          textColor={colors.textPrimary}
          renderIcon={() => <PendingIcon />}
        />
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <StatColumn
          value={loading ? 0 : inactiveWorkerCount}
          label={t.adminShell.statInactive}
          hint={t.adminShell.statInactiveHint}
          textColor={colors.textPrimary}
          renderIcon={() => <InactiveIcon />}
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
