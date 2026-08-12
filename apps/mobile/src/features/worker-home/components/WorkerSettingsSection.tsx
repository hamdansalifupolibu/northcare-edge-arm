import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type Props = {
  readonly label: string;
  readonly children: ReactNode;
};

export function WorkerSettingsSection({ label, children }: Props) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.section}>
      <AppText variant="caption" style={styles.sectionLabel}>
        {label}
      </AppText>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

type RowProps = {
  readonly label: string;
  readonly hint?: string;
  readonly children?: ReactNode;
  readonly showDivider?: boolean;
};

export function WorkerSettingsRow({ label, hint, children, showDivider = true }: RowProps) {
  const { colors } = useThemeMode();

  return (
    <View
      style={[
        styles.row,
        showDivider ? { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
      ]}
    >
      <View style={styles.rowCopy}>
        <AppText variant="label">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color="secondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      {children ? <View style={styles.rowTrailing}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTrailing: {
    flexShrink: 0,
  },
});
