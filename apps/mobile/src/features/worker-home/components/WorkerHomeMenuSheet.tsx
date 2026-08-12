import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, shadows, spacing, themedFeatureIconBackground, type HexColor } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ChevronRightIcon } from './WorkerHomeIcons';
import {
  MenuBellIcon,
  MenuLockIcon,
  MenuSettingsIcon,
  MenuSignOutIcon,
  MenuSyncIcon,
  MenuWorkerAvatarIcon,
  MenuWorkspaceIcon,
} from './WorkerHomeMenuIcons';

type Props = {
  readonly visible: boolean;
  readonly canSwitchWorkspace: boolean;
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly roleLabel: string;
  readonly onClose: () => void;
  readonly onLock: () => void;
  readonly onSignOut: () => void;
  readonly onSwitchWorkspace: () => void;
  readonly onOpenSync: () => void;
  readonly onOpenReminders: () => void;
  readonly onOpenSettings: () => void;
};

type MenuRowProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly iconBackgroundLight: HexColor;
  readonly renderIcon: () => ReactNode;
  readonly titleColor?: string;
  readonly showDivider?: boolean;
};

function MenuSectionHeader({ label }: { readonly label: string }) {
  return (
    <AppText variant="caption" style={styles.sectionHeader}>
      {label}
    </AppText>
  );
}

function MenuRow({
  title,
  subtitle,
  onPress,
  testID,
  iconBackgroundLight,
  renderIcon,
  titleColor,
  showDivider = true,
}: MenuRowProps) {
  const { colors: themeColors, isDark } = useThemeMode();
  const iconBackground = themedFeatureIconBackground(themeColors, isDark, iconBackgroundLight);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.88 : 1 }]}
        testID={testID}
      >
        <View style={[styles.iconSquare, { backgroundColor: iconBackground }]}>{renderIcon()}</View>
        <View style={styles.rowCopy}>
          <AppText
            variant="label"
            style={[styles.rowTitle, { color: titleColor ?? themeColors.textPrimary }]}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="secondary" style={styles.rowSubtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <ChevronRightIcon color={themeColors.textSecondary} />
      </Pressable>
      {showDivider ? (
        <View style={[styles.rowDivider, { backgroundColor: themeColors.border }]} />
      ) : null}
    </>
  );
}

function MenuSectionCard({ children }: { readonly children: ReactNode }) {
  const { colors: themeColors } = useThemeMode();
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function WorkerHomeMenuSheet({
  visible,
  canSwitchWorkspace,
  isOnline,
  checking,
  roleLabel,
  onClose,
  onLock,
  onSignOut,
  onSwitchWorkspace,
  onOpenSync,
  onOpenReminders,
  onOpenSettings,
}: Props) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useThemeMode();

  const connectivityLabel = checking
    ? t.workerHome.connectivityChecking
    : isOnline
      ? t.workerHome.online
      : t.workerHome.offline;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="worker-home-menu-sheet"
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t.workerHome.menuClose} />
      <View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: themeColors.border }]} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <MenuWorkerAvatarIcon />
            </View>
            <View style={styles.headerCopy}>
              <AppText variant="title" style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
                {t.workerHome.menuTitle}
              </AppText>
              <AppText variant="body" color="secondary">
                {roleLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: checking ? themeColors.disabled : isOnline ? colors.success : colors.warning },
              ]}
            />
            <AppText variant="caption" style={[styles.statusLabel, { color: themeColors.textPrimary }]}>
              {connectivityLabel}
            </AppText>
            <AppText variant="caption" color="secondary">
              {t.workerHome.menuOfflineSaved}
            </AppText>
          </View>

          <MenuSectionHeader label={t.workerHome.menuSectionWorkspace} />
          <MenuSectionCard>
            {canSwitchWorkspace ? (
              <>
                <MenuRow
                  title={t.workerHome.menuSwitchWorkspaceTitle}
                  subtitle={t.workerHome.menuSwitchWorkspaceSubtitle}
                  onPress={onSwitchWorkspace}
                  testID="worker-menu-switch-workspace"
                  iconBackgroundLight="#E6F4F1"
                  renderIcon={() => <MenuWorkspaceIcon />}
                />
                <MenuRow
                  title={t.workerHome.menuSyncTitle}
                  subtitle={t.workerHome.menuSyncSubtitle}
                  onPress={onOpenSync}
                  testID="worker-menu-sync"
                  iconBackgroundLight="#E6F4F1"
                  renderIcon={() => <MenuSyncIcon />}
                  showDivider={false}
                />
              </>
            ) : (
              <MenuRow
                title={t.workerHome.menuSyncTitle}
                subtitle={t.workerHome.menuSyncSubtitle}
                onPress={onOpenSync}
                testID="worker-menu-sync"
                iconBackgroundLight="#E6F4F1"
                renderIcon={() => <MenuSyncIcon />}
                showDivider={false}
              />
            )}
          </MenuSectionCard>

          <MenuSectionHeader label={t.workerHome.menuSectionTools} />
          <MenuSectionCard>
            <MenuRow
              title={t.workerHome.menuRemindersTitle}
              subtitle={t.workerHome.menuRemindersSubtitle}
              onPress={onOpenReminders}
              testID="worker-menu-reminders"
              iconBackgroundLight="#FFF4E6"
              renderIcon={() => <MenuBellIcon />}
            />
            <MenuRow
              title={t.workerHome.settingsTitle}
              subtitle={t.workerHome.menuSettingsSubtitle}
              onPress={onOpenSettings}
              testID="worker-menu-settings"
              iconBackgroundLight="#E6F4F1"
              renderIcon={() => <MenuSettingsIcon />}
              showDivider={false}
            />
          </MenuSectionCard>

          <MenuSectionHeader label={t.workerHome.menuSectionSecurity} />
          <MenuSectionCard>
            <MenuRow
              title={t.workerHome.menuLockTitle}
              subtitle={t.workerHome.menuLockSubtitle}
              onPress={onLock}
              testID="worker-menu-lock"
              iconBackgroundLight="#E6F4F1"
              renderIcon={() => <MenuLockIcon />}
            />
            <MenuRow
              title={t.workerShell.signOut}
              onPress={onSignOut}
              testID="worker-menu-sign-out"
              iconBackgroundLight="#FEE4E2"
              renderIcon={() => <MenuSignOutIcon />}
              titleColor={colors.danger}
              showDivider={false}
            />
          </MenuSectionCard>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,33,31,0.48)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.md,
    ...shadows.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  statusLabel: {
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  sectionHeader: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    marginLeft: spacing.xxs,
  },
  sectionCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.xs,
  },
  rowTitle: {
    fontWeight: '700',
  },
  rowSubtitle: {
    lineHeight: 18,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.base + 44 + spacing.md,
    marginRight: spacing.base,
  },
});
