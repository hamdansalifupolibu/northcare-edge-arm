import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { AuthSetupActionButton } from '../../auth/components/AuthSetupUiElements';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, shadows, spacing, themedMintSurface, themedSecurityBanner } from '../../../theme';
import type { ColorPalette } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  ProfileAgeIcon,
  ProfileBackIcon,
  ProfileChevronIcon,
  ProfileClockIcon,
  ProfileConsentIcon,
  ProfileEditIcon,
  ProfileEmptyCareIcon,
  ProfileFacilityIcon,
  ProfileIdIcon,
  ProfileLocationIcon,
  ProfileLockIcon,
  ProfileOfflineIcon,
  ProfileShieldLockIcon,
  ProfileStethoscopeIcon,
} from './ClientProfileIcons';

export function ClientProfileTopBar({
  isOnline,
  checking,
  onBack,
}: {
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly onBack: () => void;
}) {
  const t = useTranslation();
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.topBar} testID="client-profile-top-bar">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.clients.registration.returnToList}
        onPress={onBack}
        style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
        testID="client-profile-back"
      >
        <ProfileBackIcon />
      </Pressable>

      <View style={styles.logoWrap}>
        <NorthCareLogo variant="stacked" size="sm" testID="client-profile-logo" />
      </View>

      <View style={styles.trailing}>
        <View
          style={[styles.statusPill, { backgroundColor: themeColors.surface }]}
          accessibilityRole="text"
          accessibilityLabel={
            checking
              ? t.workerHome.connectivityChecking
              : isOnline
                ? t.workerHome.online
                : t.workerHome.offline
          }
          testID="client-profile-connectivity"
        >
          {!checking && !isOnline ? <ProfileOfflineIcon /> : null}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.success : colors.warning },
            ]}
          />
          <AppText variant="caption" style={[styles.statusLabel, { color: themeColors.textPrimary }]} numberOfLines={1}>
            {checking ? '…' : isOnline ? t.workerHome.online : t.workerHome.offline}
          </AppText>
        </View>
        <WorkerThemeToggle />
      </View>
    </View>
  );
}

export function ClientProfileIdentityCard({
  initials,
  displayName,
  subtitle,
  clientCode,
  ageLabel,
  consentLabel,
  locationLine,
  facilityName,
  onEdit,
}: {
  readonly initials: string;
  readonly displayName: string;
  readonly subtitle: string;
  readonly clientCode: string;
  readonly ageLabel: string;
  readonly consentLabel: string;
  readonly locationLine: string;
  readonly facilityName: string;
  readonly onEdit: () => void;
}) {
  const t = useTranslation();
  const { colors: themeColors } = useThemeMode();

  return (
    <View
      style={[styles.identityCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
      testID="client-profile-identity-card"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.clients.profile.edit}
        onPress={onEdit}
        style={[styles.editButton, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
        testID="client-profile-edit-shortcut"
      >
        <ProfileEditIcon />
      </Pressable>

      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <AppText variant="headingSmall" style={styles.avatarText}>
            {initials}
          </AppText>
        </View>
        <View style={styles.identityCopy}>
          <AppText variant="headingSmall" style={styles.clientName}>
            {displayName}
          </AppText>
          <AppText variant="body" color="secondary">
            {subtitle}
          </AppText>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <ProfileBadge icon={<ProfileIdIcon />} label={clientCode} tone="outline" />
        <ProfileBadge icon={<ProfileAgeIcon />} label={ageLabel} tone="age" />
        <ProfileBadge icon={<ProfileConsentIcon />} label={consentLabel} tone="consent" />
      </View>

      <View style={styles.metaRows}>
        <View style={styles.metaLine}>
          <ProfileLocationIcon />
          <AppText variant="body" color="secondary">
            {locationLine}
          </AppText>
        </View>
        <View style={styles.metaLine}>
          <ProfileFacilityIcon />
          <AppText variant="body" color="secondary">
            {facilityName}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function ProfileBadge({
  icon,
  label,
  tone,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly tone: 'outline' | 'age' | 'consent';
}) {
  const { colors: themeColors, semantic } = useThemeMode();
  const toneStyle =
    tone === 'age'
      ? { backgroundColor: themeColors.accentLight }
      : tone === 'consent'
        ? {
            borderWidth: 1,
            borderColor: semantic.status.stable,
            backgroundColor: semantic.status.stableBackground,
          }
        : {
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: themeColors.surface,
          };

  return (
    <View style={[styles.badge, toneStyle]}>
      {icon}
      <AppText variant="caption" style={[styles.badgeLabel, { color: themeColors.textPrimary }]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function ClientProfileStartVisitButton({ onPress }: { readonly onPress: () => void }) {
  const t = useTranslation();

  return (
    <AuthSetupActionButton
      label={t.clients.profile.startVisit}
      onPress={onPress}
      leadingIcon={<ProfileStethoscopeIcon />}
      testID="client-profile-start-visit"
    />
  );
}

export function ClientProfileQuickActionCard({
  title,
  description,
  backgroundColor,
  iconBackgroundColor,
  icon,
  onPress,
  cardWidth,
  testID,
}: {
  readonly title: string;
  readonly description: string;
  readonly backgroundColor: string;
  readonly iconBackgroundColor: string;
  readonly icon: ReactNode;
  readonly onPress: () => void;
  readonly cardWidth: number;
  readonly testID?: string;
}) {
  const { colors: themeColors } = useThemeMode();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        {
          backgroundColor,
          width: cardWidth,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.quickActionIconCircle, { backgroundColor: iconBackgroundColor }]}>
        {icon}
      </View>
      <View style={styles.quickActionCopy}>
        <AppText variant="label" style={[styles.quickActionTitle, { color: themeColors.textPrimary }]} numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color="secondary" numberOfLines={2} style={styles.quickActionDescription}>
          {description}
        </AppText>
      </View>
      <ProfileChevronIcon size={14} color={colors.textSecondary} />
    </Pressable>
  );
}

export function ClientProfileQuickActionsGrid({ children }: { readonly children: ReactNode }) {
  return (
    <View style={styles.quickActionsGrid} testID="client-profile-quick-actions">
      {children}
    </View>
  );
}

export function ClientProfileSectionCard({
  title,
  children,
  footer,
  testID,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly testID?: string;
}) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View
      style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
      testID={testID}
    >
      <AppText variant="headingSmall">{title}</AppText>
      {children}
      {footer}
    </View>
  );
}

export function ClientProfileDetailRow({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  const { semantic } = useThemeMode();

  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIconWrap, { backgroundColor: semantic.surface.muted }]}>{icon}</View>
      <View style={styles.detailCopy}>
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
        <AppText variant="body" numberOfLines={3}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function ClientProfileDualColumn({ children }: { readonly children: ReactNode }) {
  return <View style={styles.dualColumn}>{children}</View>;
}

export function ClientProfileDualColumnItem({ children }: { readonly children: ReactNode }) {
  return <View style={styles.dualColumnItem}>{children}</View>;
}

export function ClientProfileRecentCareEmpty({ body }: { readonly body: string }) {
  const { semantic } = useThemeMode();

  return (
    <View style={styles.emptyCare}>
      <View style={[styles.emptyCareIconWrap, { backgroundColor: semantic.surface.muted }]}>
        <ProfileEmptyCareIcon />
      </View>
      <AppText variant="body" color="secondary" style={styles.emptyCareText}>
        {body}
      </AppText>
    </View>
  );
}

export function ClientProfileRecentCareItem({
  title,
  subtitle,
  onPress,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly onPress: () => void;
}) {
  const { colors: themeColors } = useThemeMode();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.recentItem, { borderColor: themeColors.border }]}
    >
      <View style={styles.recentItemCopy}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="secondary">
          {subtitle}
        </AppText>
      </View>
      <ProfileChevronIcon size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

export function ClientProfileHistoryButton({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.historyButton}
      testID="client-profile-view-history"
    >
      <AppText variant="button" style={styles.historyButtonLabel}>
        {label}
      </AppText>
      <ProfileChevronIcon size={16} color={colors.primary} />
    </Pressable>
  );
}

export function ClientProfileLastUpdated({ label }: { readonly label: string }) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={[styles.lastUpdatedRow, { borderTopColor: themeColors.border }]}>
      <ProfileClockIcon />
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
    </View>
  );
}

export function ClientProfileSecurityBanner({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) {
  const { colors: themeColors, isDark } = useThemeMode();
  const banner = themedSecurityBanner(themeColors, isDark);

  return (
    <View
      style={[
        styles.securityBanner,
        { backgroundColor: banner.background, borderColor: banner.border },
      ]}
      testID="client-profile-security-banner"
    >
      <View style={[styles.securityIconWrap, { backgroundColor: themeColors.surface }]}>
        <ProfileShieldLockIcon />
      </View>
      <View style={styles.securityCopy}>
        <AppText variant="bodyStrong" style={{ color: colors.primaryDark }}>
          {title}
        </AppText>
        <AppText variant="caption" color="secondary">
          {body}
        </AppText>
      </View>
      <ProfileLockIcon />
    </View>
  );
}

export function getClientProfileQuickActionColors(palette: ColorPalette, isDark: boolean) {
  const mintSurface = themedMintSurface(palette, isDark);
  return {
    nutrition: {
      card: isDark ? palette.mutedSurface : '#FFF9E6',
      icon: isDark ? palette.surface : '#FFEFB8',
    },
    voice: {
      card: isDark ? palette.mutedSurface : '#F3E8FF',
      icon: isDark ? palette.surface : '#E9D5FF',
    },
    referral: {
      card: isDark ? palette.mutedSurface : '#EDE9FE',
      icon: isDark ? palette.surface : '#DDD6FE',
    },
    reminder: {
      card: mintSurface,
      icon: isDark ? palette.surface : '#B8EBE3',
    },
  } as const;
}

export function useClientProfileQuickActionColors() {
  const { colors: palette, isDark } = useThemeMode();
  return useMemo(() => getClientProfileQuickActionColors(palette, isDark), [palette, isDark]);
}

/** Light-mode quick-action palette for callers not yet using useClientProfileQuickActionColors(). */
export const clientProfileQuickActionColors = getClientProfileQuickActionColors(colors, false);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 92,
    ...shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  statusLabel: {
    fontWeight: '600',
    fontSize: 11,
  },
  identityCard: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.md,
    ...shadows.sm,
  },
  editButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing['3xl'],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  clientName: {
    color: colors.primaryDark,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: '100%',
  },
  badgeLabel: {
    fontWeight: '600',
  },
  metaRows: {
    gap: spacing.sm,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 76,
    ...shadows.sm,
  },
  quickActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickActionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  quickActionTitle: {
    fontWeight: '700',
  },
  quickActionDescription: {
    lineHeight: 16,
  },
  dualColumn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dualColumnItem: {
    flex: 1,
    minWidth: 0,
  },
  sectionCard: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  emptyCare: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyCareIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCareText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  recentItemCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.xs,
  },
  historyButtonLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  securityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
