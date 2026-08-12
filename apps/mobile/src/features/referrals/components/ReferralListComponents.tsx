import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { colors, layout, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import {
  ReferralChevronRightIcon,
  ReferralEmptyIllustration,
  ReferralOnDeviceIcon,
  ReferralPencilIcon,
  ReferralPrepareIcon,
  ReferralShieldCheckIcon,
  ReferralVerifyScanIcon,
} from './ReferralListIcons';

type ReferralListHeaderProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly onDeviceLabel: string;
  readonly checking: boolean;
};

export function ReferralListHeader({
  title,
  subtitle,
  onDeviceLabel,
  checking,
}: ReferralListHeaderProps) {
  const { colors: themeColors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View style={styles.headerRoot} testID="referral-list-header">
      <View style={styles.headerTopRow}>
        <View style={styles.headerLogoWrap}>
          <NorthCareLogo variant="stacked" size="sm" testID="referral-list-logo" />
        </View>
        <View style={styles.headerTrailing}>
          <View
            style={[styles.onDevicePill, { backgroundColor: mintSurface }]}
            accessibilityRole="text"
            accessibilityLabel={onDeviceLabel}
            testID="referral-list-on-device"
          >
            <ReferralOnDeviceIcon color={colors.primaryDark} />
            <AppText variant="caption" style={styles.onDeviceLabel} numberOfLines={1}>
              {checking ? '…' : onDeviceLabel}
            </AppText>
          </View>
          <WorkerThemeToggle />
        </View>
      </View>
      <View style={styles.headerTitleBlock}>
        <AppText variant="headingLarge" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
          {title}
        </AppText>
        <AppText variant="body" color="secondary" style={styles.headerSubtitle}>
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

type ReferralPrimaryActionsProps = {
  readonly prepareTitle: string;
  readonly prepareDescription: string;
  readonly verifyTitle: string;
  readonly verifyDescription: string;
  readonly onPreparePress: () => void;
  readonly onVerifyPress: () => void;
};

export function ReferralPrimaryActions({
  prepareTitle,
  prepareDescription,
  verifyTitle,
  verifyDescription,
  onPreparePress,
  onVerifyPress,
}: ReferralPrimaryActionsProps) {
  const { width } = useWindowDimensions();
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const cardWidth = Math.max(148, (width - layout.screenHorizontalPadding * 2 - spacing.sm) / 2);

  return (
    <View style={styles.primaryActionsRow} testID="referral-primary-actions">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${prepareTitle}. ${prepareDescription}`}
        onPress={onPreparePress}
        style={({ pressed }) => [
          styles.prepareCard,
          { width: cardWidth, opacity: pressed ? 0.92 : 1 },
        ]}
        testID="referral-prepare-action"
      >
        <View style={styles.prepareIconWrap}>
          <ReferralPrepareIcon />
        </View>
        <View style={styles.primaryCardCopy}>
          <AppText variant="bodyStrong" color="inverse" style={styles.primaryCardTitle}>
            {prepareTitle}
          </AppText>
          <AppText variant="caption" color="inverse" style={styles.primaryCardBody}>
            {prepareDescription}
          </AppText>
        </View>
        <ReferralChevronRightIcon color={colors.textInverse} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${verifyTitle}. ${verifyDescription}`}
        onPress={onVerifyPress}
        style={({ pressed }) => [
          styles.verifyCard,
          {
            width: cardWidth,
            backgroundColor: themeColors.surface,
            borderColor: semantic.border.default,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
        testID="referral-verify-action"
      >
        <View style={[styles.verifyIconWrap, { backgroundColor: mintSurface }]}>
          <ReferralVerifyScanIcon />
        </View>
        <View style={styles.primaryCardCopy}>
          <AppText variant="bodyStrong" style={{ color: colors.primaryDark }}>
            {verifyTitle}
          </AppText>
          <AppText variant="caption" color="secondary">
            {verifyDescription}
          </AppText>
        </View>
        <ReferralChevronRightIcon />
      </Pressable>
    </View>
  );
}

type ReferralEmptyStateCardProps = {
  readonly title: string;
  readonly bodyPrefix: string;
  readonly bodyAction: string;
  readonly bodySuffix: string;
};

export function ReferralEmptyStateCard({
  title,
  bodyPrefix,
  bodyAction,
  bodySuffix,
}: ReferralEmptyStateCardProps) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      style={[
        styles.emptyCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
        },
      ]}
      testID="referral-empty-state"
    >
      <ReferralEmptyIllustration />
      <AppText variant="headingSmall" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
        {title}
      </AppText>
      <AppText variant="body" color="secondary" style={styles.emptyBody}>
        {bodyPrefix}
        <AppText variant="bodyStrong" style={{ color: colors.primary }}>
          {bodyAction}
        </AppText>
        {bodySuffix}
      </AppText>
    </View>
  );
}

type ReferralVerifyOfflineSectionProps = {
  readonly title: string;
  readonly body: string;
  readonly scanTitle: string;
  readonly scanDescription: string;
  readonly manualTitle: string;
  readonly manualDescription: string;
  readonly onScanPress: () => void;
  readonly onManualPress: () => void;
};

export function ReferralVerifyOfflineSection({
  title,
  body,
  scanTitle,
  scanDescription,
  manualTitle,
  manualDescription,
  onScanPress,
  onManualPress,
}: ReferralVerifyOfflineSectionProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View
      style={[
        styles.verifySection,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
        },
      ]}
      testID="referral-verify-offline-section"
    >
      <View style={styles.verifySectionHeader}>
        <View style={[styles.verifyShieldWrap, { backgroundColor: mintSurface }]}>
          <ReferralShieldCheckIcon />
        </View>
        <View style={styles.verifySectionCopy}>
          <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
            {title}
          </AppText>
          <AppText variant="caption" color="secondary" style={styles.verifySectionBody}>
            {body}
          </AppText>
        </View>
      </View>

      <ReferralVerifyActionRow
        title={scanTitle}
        description={scanDescription}
        icon={<ReferralVerifyScanIcon size={20} />}
        onPress={onScanPress}
        testID="referral-scan-passport-row"
      />
      <ReferralVerifyActionRow
        title={manualTitle}
        description={manualDescription}
        icon={<ReferralPencilIcon size={20} />}
        onPress={onManualPress}
        testID="referral-enter-code-row"
      />
    </View>
  );
}

function ReferralVerifyActionRow({
  title,
  description,
  icon,
  onPress,
  testID,
}: {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.verifyActionRow,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.verifyActionIconWrap, { backgroundColor: mintSurface }]}>{icon}</View>
      <View style={styles.verifyActionCopy}>
        <AppText variant="bodyStrong" style={{ color: colors.primaryDark }}>
          {title}
        </AppText>
        <AppText variant="caption" color="secondary">
          {description}
        </AppText>
      </View>
      <ReferralChevronRightIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    gap: spacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLogoWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  onDevicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    maxWidth: 150,
  },
  onDeviceLabel: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
  },
  headerTitleBlock: {
    gap: spacing.xs,
  },
  headerSubtitle: {
    lineHeight: 22,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  prepareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 112,
    ...shadows.sm,
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 112,
    ...shadows.sm,
  },
  prepareIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  primaryCardTitle: {
    fontWeight: '800',
  },
  primaryCardBody: {
    opacity: 0.92,
    lineHeight: 16,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    ...shadows.sm,
  },
  emptyBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
  verifySection: {
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    ...shadows.sm,
  },
  verifySectionHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingBottom: spacing.xs,
  },
  verifyShieldWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifySectionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  verifySectionBody: {
    lineHeight: 18,
  },
  verifyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  verifyActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyActionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
