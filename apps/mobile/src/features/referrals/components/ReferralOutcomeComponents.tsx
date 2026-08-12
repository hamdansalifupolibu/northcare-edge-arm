import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Referral } from '../../../data/domain/entities/entities';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { AuthSetupActionButton } from '../../auth/components/AuthSetupUiElements';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { colors, layout, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ReferralStatusChip } from './ReferralStatusChip';
import {
  ReferralBackIcon,
  ReferralCheckCircleIcon,
  ReferralChevronRightIcon,
  ReferralLockIcon,
  ReferralPrepareIcon,
  ReferralQrShieldIcon,
  ReferralShieldCheckIcon,
} from './ReferralListIcons';

type ReferralFlowHeaderProps = {
  readonly onBack?: () => void;
  readonly testID?: string;
};

export function ReferralFlowHeader({ onBack, testID = 'referral-flow-header' }: ReferralFlowHeaderProps) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.flowHeader} testID={testID}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={[styles.headerIconButton, { backgroundColor: themeColors.surface }]}
        >
          <ReferralBackIcon />
        </Pressable>
      ) : (
        <View style={styles.headerIconSpacer} />
      )}
      <View style={styles.headerLogoWrap}>
        <NorthCareLogo variant="stacked" size="sm" />
      </View>
      <WorkerThemeToggle />
    </View>
  );
}

type ReferralHeroCardProps = {
  readonly icon: ReactNode;
  readonly title: string;
  readonly body: string;
  readonly testID?: string;
};

export function ReferralHeroCard({ icon, title, body, testID }: ReferralHeroCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View
      style={[
        styles.heroCard,
        { backgroundColor: themeColors.surface, borderColor: semantic.border.default },
      ]}
      testID={testID}
    >
      <View style={[styles.heroIconWrap, { backgroundColor: mintSurface }]}>{icon}</View>
      <AppText variant="headingSmall" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
        {title}
      </AppText>
      <AppText variant="body" color="secondary" style={styles.heroBody}>
        {body}
      </AppText>
    </View>
  );
}

export function ReferralSuccessHero({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) {
  return (
    <ReferralHeroCard
      icon={<ReferralCheckCircleIcon />}
      title={title}
      body={body}
      testID="referral-success-hero"
    />
  );
}

type ReferralNextStepCardProps = {
  readonly title: string;
  readonly body: string;
  readonly hint?: string;
};

export function ReferralNextStepCard({ title, body, hint }: ReferralNextStepCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View
      style={[
        styles.nextStepCard,
        { backgroundColor: mintSurface, borderColor: semantic.border.default },
      ]}
      testID="referral-next-step-card"
    >
      <ReferralShieldCheckIcon size={20} />
      <View style={styles.nextStepCopy}>
        <AppText variant="label" style={{ color: themeColors.textPrimary }}>
          {title}
        </AppText>
        <AppText variant="body" color="secondary">
          {body}
        </AppText>
        {hint ? (
          <AppText variant="caption" color="secondary">
            {hint}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

type ReferralActionStackProps = {
  readonly children: ReactNode;
};

export function ReferralActionStack({ children }: ReferralActionStackProps) {
  return <View style={styles.actionStack}>{children}</View>;
}

type ReferralPassportQrHeroProps = {
  readonly qrNode: ReactNode;
  readonly title: string;
  readonly privacyNote: string;
  readonly offlineNote: string;
};

export function ReferralPassportQrHero({
  qrNode,
  title,
  privacyNote,
  offlineNote,
}: ReferralPassportQrHeroProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View
      style={[
        styles.passportHero,
        { backgroundColor: themeColors.surface, borderColor: semantic.border.default },
      ]}
      testID="referral-passport-hero"
    >
      <View style={styles.passportHeroTop}>
        <ReferralQrShieldIcon />
        <AppText variant="headingSmall" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
          {title}
        </AppText>
      </View>
      <View style={[styles.qrFrame, { backgroundColor: mintSurface, borderColor: semantic.border.default }]}>
        {qrNode}
      </View>
      <View style={styles.passportNotes}>
        <View style={styles.passportNoteRow}>
          <ReferralLockIcon />
          <AppText variant="caption" color="secondary" style={styles.passportNoteText}>
            {privacyNote}
          </AppText>
        </View>
        <AppText variant="caption" color="secondary">
          {offlineNote}
        </AppText>
      </View>
    </View>
  );
}

type ReferralDetailSummaryCardProps = {
  readonly referenceCode: string;
  readonly clientName: string;
  readonly status: Referral['status'];
  readonly rows: readonly { readonly label: string; readonly value: string }[];
};

export function ReferralDetailSummaryCard({
  referenceCode,
  clientName,
  status,
  rows,
}: ReferralDetailSummaryCardProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      style={[
        styles.detailCard,
        { backgroundColor: themeColors.surface, borderColor: semantic.border.default },
      ]}
      testID="referral-detail-summary"
    >
      <View style={styles.detailHeader}>
        <View style={styles.detailHeaderCopy}>
          <AppText variant="headingSmall" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
            {referenceCode}
          </AppText>
          <AppText variant="body" style={{ color: colors.primary }}>
            {clientName}
          </AppText>
        </View>
        <ReferralStatusChip status={status} />
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.detailRow}>
          <AppText variant="caption" color="secondary">
            {row.label}
          </AppText>
          <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
            {row.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

type ReferralQuickActionRowProps = {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly onPress: () => void;
  readonly testID: string;
  readonly variant?: 'primary' | 'secondary';
};

export function ReferralQuickActionRow({
  title,
  description,
  icon,
  onPress,
  testID,
  variant = 'secondary',
}: ReferralQuickActionRowProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionRow,
        isPrimary
          ? styles.quickActionPrimary
          : {
              backgroundColor: themeColors.surface,
              borderColor: semantic.border.default,
            },
        { opacity: pressed ? 0.92 : 1 },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: isPrimary ? 'rgba(255,255,255,0.18)' : mintSurface },
        ]}
      >
        {icon ?? <ReferralChevronRightIcon color={isPrimary ? colors.textInverse : colors.primary} />}
      </View>
      <View style={styles.quickActionCopy}>
        <AppText
          variant="bodyStrong"
          style={{ color: isPrimary ? colors.textInverse : colors.primaryDark }}
        >
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" color={isPrimary ? 'inverse' : 'secondary'}>
            {description}
          </AppText>
        ) : null}
      </View>
      <ReferralChevronRightIcon color={isPrimary ? colors.textInverse : colors.primary} />
    </Pressable>
  );
}

type ClientReferralsScreenLayoutProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly prepareLabel: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly onBack: () => void;
  readonly onPrepare: () => void;
  readonly children: ReactNode;
};

export function ClientReferralsScreenLayout({
  title,
  subtitle,
  prepareLabel,
  emptyTitle,
  emptyBody,
  onBack,
  onPrepare,
  children,
}: ClientReferralsScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={[styles.clientReferralsRoot, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <ReferralFlowHeader onBack={onBack} />
      <ScrollView
        contentContainerStyle={[
          styles.clientReferralsScroll,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <AppText variant="headingLarge" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
            {title}
          </AppText>
          <AppText variant="body" color="secondary">
            {subtitle}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={prepareLabel}
          onPress={onPrepare}
          style={({ pressed }) => [styles.prepareBanner, { opacity: pressed ? 0.92 : 1 }]}
          testID="client-referrals-prepare"
        >
          <View style={styles.prepareBannerIcon}>
            <ReferralPrepareIcon />
          </View>
          <View style={styles.prepareBannerCopy}>
            <AppText variant="bodyStrong" color="inverse">
              {prepareLabel}
            </AppText>
            <AppText variant="caption" color="inverse" style={{ opacity: 0.9 }}>
              Start a new referral for this client
            </AppText>
          </View>
          <ReferralChevronRightIcon color={colors.textInverse} />
        </Pressable>

        {children}
      </ScrollView>
    </View>
  );
}

export function ClientReferralHistoryRow({
  referral,
  onPress,
}: {
  readonly referral: Referral;
  readonly onPress: () => void;
}) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyRow,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.historyCopy}>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
          {referral.referenceCode ?? 'Referral'}
        </AppText>
        <ReferralStatusChip status={referral.status} />
      </View>
      <ReferralChevronRightIcon />
    </Pressable>
  );
}

export function ReferralEmptyHistoryCard({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      style={[
        styles.emptyHistoryCard,
        { backgroundColor: themeColors.surface, borderColor: semantic.border.default },
      ]}
    >
      <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
        {title}
      </AppText>
      <AppText variant="body" color="secondary">
        {body}
      </AppText>
    </View>
  );
}

export function ReferralScreenScaffold({
  onBack,
  children,
  footer,
  testID,
}: {
  readonly onBack?: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      style={[styles.scaffoldRoot, { backgroundColor: themeColors.background, paddingTop: insets.top }]}
      testID={testID}
    >
      <ReferralFlowHeader onBack={onBack} />
      <ScrollView
        contentContainerStyle={[
          styles.scaffoldScroll,
          { paddingBottom: footer ? insets.bottom + 96 : insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.scaffoldFooter,
            {
              paddingBottom: insets.bottom + spacing.sm,
              backgroundColor: themeColors.background,
              borderTopColor: semantic.border.default,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function ReferralPrimaryFooterButton({
  label,
  onPress,
  disabled,
  loading,
  testID,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly testID?: string;
}) {
  return (
    <AuthSetupActionButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerIconSpacer: {
    width: 44,
  },
  headerLogoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
  nextStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  nextStepCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  actionStack: {
    gap: spacing.sm,
  },
  passportHero: {
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  passportHeroTop: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrFrame: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  passportNotes: {
    gap: spacing.sm,
  },
  passportNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  passportNoteText: {
    flex: 1,
    lineHeight: 18,
  },
  detailCard: {
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailHeaderCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  detailRow: {
    gap: spacing.xxs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.15)',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  quickActionPrimary: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  clientReferralsRoot: {
    flex: 1,
  },
  clientReferralsScroll: {
    paddingHorizontal: layout.screenHorizontalPadding,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  prepareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  prepareBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepareBannerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  historyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  emptyHistoryCard: {
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  scaffoldRoot: {
    flex: 1,
  },
  scaffoldScroll: {
    paddingHorizontal: layout.screenHorizontalPadding,
    gap: spacing.lg,
  },
  scaffoldFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
