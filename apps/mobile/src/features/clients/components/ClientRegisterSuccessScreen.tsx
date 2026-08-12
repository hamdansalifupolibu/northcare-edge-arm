import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import { isClientSex, type ClientSex } from '../../../data/domain/enums/clientSex';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { colors, layout, radii, shadows, spacing, themedMintSurface, themedSecurityBanner } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import type { RegisterClientDraft } from '../application/validation';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import {
  AuthSetupActionButton,
  ChevronRightIcon,
  GoldAccentBar,
} from '../../auth/components/AuthSetupUiElements';
import {
  ChildUnderFiveCategoryIcon,
  NewbornCategoryIcon,
  PostnatalCategoryIcon,
  PregnantCategoryIcon,
} from './ClientRegisterCategoryIcons';
import { PrivacyAvatar } from './PrivacyAvatar';

type Props = {
  readonly testID?: string;
  readonly draft: RegisterClientDraft;
  readonly facilityName: string;
  readonly title: string;
  readonly body: string;
  readonly offlineTitle: string;
  readonly offlineBody: string;
  readonly savedLocallyLabel: string;
  readonly viewProfileLabel: string;
  readonly registerAnotherLabel: string;
  readonly scheduleReminderLabel: string;
  readonly returnToListLabel: string;
  readonly goHomeLabel: string;
  readonly categoryLabel: (category: ClientCategory) => string;
  readonly sexLabel: (sex: ClientSex) => string;
  readonly onBack: () => void;
  readonly onViewProfile: () => void;
  readonly onRegisterAnother: () => void;
  readonly onScheduleReminder: () => void;
  readonly onReturnToList: () => void;
  readonly onGoHome: () => void;
};

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M15 6 L9 12 L15 18"
        fill="none"
        stroke={colors.primaryDark}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function categoryIcon(category: ClientCategory) {
  switch (category) {
    case 'pregnant':
      return <PregnantCategoryIcon size={14} />;
    case 'postnatal':
      return <PostnatalCategoryIcon size={14} />;
    case 'newborn':
      return <NewbornCategoryIcon size={14} />;
    case 'childUnderFive':
      return <ChildUnderFiveCategoryIcon size={14} />;
    default:
      return null;
  }
}

function PersonMetaIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" accessible={false}>
      <Path d="M12 11 C14.2 11 16 9.2 16 7 C16 4.8 14.2 3 12 3 C9.8 3 8 4.8 8 7 C8 9.2 9.8 11 12 11 Z" fill={colors.textSecondary} />
      <Path d="M6 20 C6 16 8.5 14 12 14 C15.5 14 18 16 18 20" fill={colors.textSecondary} />
    </Svg>
  );
}

function LocationMetaIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 21 C12 21 6 15 6 10 C6 7.2 8.2 5 12 5 C15.8 5 18 7.2 18 10 C18 15 12 21 12 21 Z"
        fill="none"
        stroke={colors.textSecondary}
        strokeWidth={1.5}
      />
      <Path d="M12 10.5 C12.8 10.5 13.5 9.8 13.5 9 C13.5 8.2 12.8 7.5 12 7.5 C11.2 7.5 10.5 8.2 10.5 9 C10.5 9.8 11.2 10.5 12 10.5 Z" fill={colors.textSecondary} />
    </Svg>
  );
}

function OfflineCloudIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 18 H16 C18.2 18 20 16.2 20 14 C20 12.1 18.7 10.5 16.9 10.1 C16.4 7.6 14.2 5.8 11.6 5.8 C9.1 5.8 7 7.4 6.3 9.6 C4.3 10.1 3 11.9 3 14 C3 16.2 4.8 18 6 18 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M4 4 L20 20" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarRowIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 5 H18 C19.1 5 20 5.9 20 7 V19 C20 20.1 19.1 21 18 21 H6 C4.9 21 4 20.1 4 19 V7 C4 5.9 4.9 5 6 5 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
      />
      <Path d="M8 3 V7 M16 3 V7 M4 10 H20" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ClientsNavIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
      <Path d="M9 11 C11.2 11 13 9.2 13 7 C13 4.8 11.2 3 9 3 C6.8 3 5 4.8 5 7 C5 9.2 6.8 11 9 11 Z" fill={colors.primary} />
      <Path d="M3 20 C3 16 5.5 14 9 14 C12.5 14 15 16 15 20" fill={colors.primary} />
      <Path d="M16 10.5 C17.7 10.5 19 9.2 19 7.5 C19 5.8 17.7 4.5 16 4.5 C14.3 4.5 13 5.8 13 7.5 C13 9.2 14.3 10.5 16 10.5 Z" fill={colors.primary} />
      <Path d="M13 20 C13 17.5 14.5 16 16 16 C17.5 16 19 17.5 19 20" fill={colors.primary} />
    </Svg>
  );
}

function HomeNavIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 11 L12 4 L20 11 V19 C20 20.1 19.1 21 18 21 H6 C4.9 21 4 20.1 4 19 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M9 21 V13 H15 V21" fill="none" stroke={colors.primary} strokeWidth={1.5} />
    </Svg>
  );
}

function SuccessShieldHero({ mintSurface }: { readonly mintSurface: string }) {
  return (
    <View style={styles.heroWrap} accessibilityElementsHidden>
      <View style={[styles.heroRingOuter, { backgroundColor: mintSurface }]} />
      <View style={[styles.heroRingInner, { backgroundColor: mintSurface, opacity: 0.85 }]} />
      <View style={styles.heroShieldCircle}>
        <Svg width={44} height={44} viewBox="0 0 24 24" accessible={false}>
          <Path
            d="M12 2 L20 6 V11 C20 16 16.5 19.5 12 22 C7.5 19.5 4 16 4 11 V6 Z"
            fill={colors.primaryDark}
            strokeLinejoin="round"
          />
          <Path
            d="M8 12 L11 15 L16 9"
            fill="none"
            stroke={colors.accent}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.sparkleLeft} accessible={false}>
        <Path d="M12 6 V18 M6 12 H18" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" />
      </Svg>
      <Svg width={12} height={12} viewBox="0 0 24 24" style={styles.sparkleRight} accessible={false}>
        <Path d="M12 7 V17 M7 12 H17" stroke={colors.accent} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function SavedLocallyBadge({
  label,
  mintSurface,
}: {
  readonly label: string;
  readonly mintSurface: string;
}) {
  return (
    <View style={[styles.savedBadge, { backgroundColor: mintSurface }]}>
      <Svg width={12} height={12} viewBox="0 0 24 24" accessible={false}>
        <Path
          d="M6 12 L10 16 L18 8"
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <AppText variant="caption" color="action" style={styles.savedBadgeText}>
        {label}
      </AppText>
    </View>
  );
}

function MetaRow({ icon, text }: { readonly icon: ReactNode; readonly text: string }) {
  return (
    <View style={styles.metaRow}>
      {icon}
      <AppText variant="caption" color="secondary" style={styles.metaText}>
        {text}
      </AppText>
    </View>
  );
}

export function ClientRegisterSuccessScreen({
  testID = 'client-register-success',
  draft,
  facilityName,
  title,
  body,
  offlineTitle,
  offlineBody,
  savedLocallyLabel,
  viewProfileLabel,
  registerAnotherLabel,
  scheduleReminderLabel,
  returnToListLabel,
  goHomeLabel,
  categoryLabel,
  sexLabel,
  onBack,
  onViewProfile,
  onRegisterAnother,
  onScheduleReminder,
  onReturnToList,
  onGoHome,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const securityBanner = themedSecurityBanner(themeColors, isDark);
  const displayName = [draft.givenName.trim(), draft.familyName.trim()].filter(Boolean).join(' ') || '—';
  const categoryText = draft.category ? categoryLabel(draft.category) : '—';
  const resolvedSex = isClientSex(draft.sex) ? sexLabel(draft.sex) : '—';

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]} testID={testID}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={[
              styles.iconButton,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
            testID="client-register-success-back"
          >
            <BackIcon />
          </Pressable>
          <NorthCareLogo variant="stacked" size="sm" testID="client-register-success-logo" />
          <WorkerThemeToggle />
        </View>

        <SuccessShieldHero mintSurface={mintSurface} />

        <View style={styles.titleBlock}>
          <AppText variant="headingLarge" style={[styles.title, { color: themeColors.textPrimary }]}>
            {title}
          </AppText>
          <GoldAccentBar />
        </View>

        <AppText variant="body" color="secondary" style={styles.body}>
          {body}
        </AppText>

        <View style={[styles.clientCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.clientCardMain}>
            <View style={[styles.clientAvatarWrap, { backgroundColor: mintSurface }]}>
              <PrivacyAvatar
                givenName={draft.givenName}
                familyName={draft.familyName}
                size={52}
                showTrailingSpace={false}
                testID="client-register-success-avatar"
              />
            </View>
            <View style={styles.clientCardCopy}>
              <AppText variant="title" style={[styles.clientName, { color: themeColors.textPrimary }]}>
                {displayName}
              </AppText>
              <MetaRow
                icon={draft.category ? categoryIcon(draft.category) : <PersonMetaIcon />}
                text={`${categoryText} · ${resolvedSex}`}
              />
              <MetaRow icon={<LocationMetaIcon />} text={facilityName || '—'} />
            </View>
          </View>
          <SavedLocallyBadge label={savedLocallyLabel} mintSurface={mintSurface} />
        </View>

        <View
          style={[
            styles.offlineCard,
            {
              backgroundColor: securityBanner.background,
              borderColor: securityBanner.border,
            },
          ]}
        >
          <View style={[styles.offlineIconWrap, { backgroundColor: themeColors.surface }]}>
            <OfflineCloudIcon />
          </View>
          <View style={styles.offlineCopy}>
            <AppText variant="bodyStrong" color="action">
              {offlineTitle}
            </AppText>
            <AppText variant="caption" color="secondary">
              {offlineBody}
            </AppText>
          </View>
        </View>

        <View style={styles.actions}>
          <AuthSetupActionButton
            label={viewProfileLabel}
            onPress={onViewProfile}
            testID="client-register-view-profile"
          />
          <AuthSetupActionButton
            label={registerAnotherLabel}
            variant="secondary"
            onPress={onRegisterAnother}
            testID="client-register-register-another"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={scheduleReminderLabel}
          onPress={onScheduleReminder}
          style={({ pressed }) => [
            styles.scheduleRow,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          testID="client-register-schedule-follow-up"
        >
          <View style={[styles.scheduleIconWrap, { backgroundColor: mintSurface }]}>
            <CalendarRowIcon />
          </View>
          <AppText variant="body" style={[styles.scheduleLabel, { color: themeColors.textPrimary }]}>
            {scheduleReminderLabel}
          </AppText>
          <ChevronRightIcon color={colors.primaryDark} />
        </Pressable>

        <View style={[styles.bottomNav, { borderTopColor: themeColors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={returnToListLabel}
            onPress={onReturnToList}
            style={({ pressed }) => [styles.bottomNavItem, { opacity: pressed ? 0.85 : 1 }]}
            testID="client-register-return-list"
          >
            <ClientsNavIcon />
            <AppText variant="caption" color="action" style={styles.bottomNavLabel}>
              {returnToListLabel}
            </AppText>
          </Pressable>
          <View style={[styles.bottomNavDivider, { backgroundColor: themeColors.border }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={goHomeLabel}
            onPress={onGoHome}
            style={({ pressed }) => [styles.bottomNavItem, { opacity: pressed ? 0.85 : 1 }]}
            testID="client-register-go-home"
          >
            <HomeNavIcon />
            <AppText variant="caption" color="action" style={styles.bottomNavLabel}>
              {goHomeLabel}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  heroRingOuter: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: radii.pill,
    opacity: 0.55,
  },
  heroRingInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: radii.pill,
  },
  heroShieldCircle: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sparkleLeft: {
    position: 'absolute',
    left: 8,
    top: 28,
  },
  sparkleRight: {
    position: 'absolute',
    right: 12,
    bottom: 36,
  },
  titleBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  clientCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.md,
    ...shadows.sm,
  },
  clientCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  clientAvatarWrap: {
    borderRadius: radii.pill,
    padding: spacing.xxs,
  },
  clientCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  clientName: {
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    flex: 1,
  },
  savedBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  savedBadgeText: {
    fontWeight: '700',
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  offlineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    ...shadows.sm,
  },
  scheduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleLabel: {
    flex: 1,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  bottomNavDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  bottomNavLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
