import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useKeyboardBottomInset } from '../../../design-system/hooks/useKeyboardBottomInset';
import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { AuthSetupActionButton } from '../../auth/components/AuthSetupUiElements';
import { colors, layout, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { ClientProfileSecurityBanner, ClientProfileTopBar } from './ClientProfileComponents';
import { ProfileAgeIcon, ProfileFacilityIcon } from './ClientProfileIcons';

function ShieldLockSmallIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19 12 22 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 11 V9.5 C9 8.1 10.3 7 12 7 C13.7 7 15 8.1 15 9.5 V11"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 11 H15.5 C16.3 11 17 11.7 17 12.5 V15.5 C17 16.3 16.3 17 15.5 17 H8.5 C7.7 17 7 16.3 7 15.5 V12.5 C7 11.7 7.7 11 8.5 11 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly onBack: () => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly saveLabel: string;
  readonly cancelLabel: string;
  readonly securityTitle: string;
  readonly securityBody: string;
  readonly saving?: boolean;
  readonly saveDisabled?: boolean;
  readonly children: ReactNode;
  readonly testID?: string;
};

export function ClientEditShell({
  title,
  subtitle,
  onBack,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  securityTitle,
  securityBody,
  saving = false,
  saveDisabled = false,
  children,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const keyboardOpen = keyboardInset > 0;
  const { colors: themeColors } = useThemeMode();
  const { isOnline, checking } = useConnectivity();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      testID={testID}
    >
      <StatusBar style="dark" />
      <View style={styles.contentColumn}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom:
                spacing.lg +
                (Platform.OS === 'android' ? keyboardInset + spacing.xl : spacing.xl),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <ClientProfileTopBar isOnline={isOnline} checking={checking} onBack={onBack} />

          <AppText variant="headingLarge" style={[styles.title, { color: themeColors.textPrimary }]}>
            {title}
          </AppText>
          <AppText variant="body" color="secondary" style={styles.subtitle}>
            {subtitle}
          </AppText>

          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              backgroundColor: themeColors.background,
              borderTopColor: themeColors.border,
            },
          ]}
        >
          {!keyboardOpen ? (
            <ClientProfileSecurityBanner title={securityTitle} body={securityBody} />
          ) : null}
          <View style={styles.footerActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.footerBackButton,
                { opacity: pressed ? 0.92 : 1 },
              ]}
              testID="client-edit-cancel"
            >
              <AppText variant="button" style={styles.footerBackLabel}>
                {cancelLabel}
              </AppText>
            </Pressable>
            <View style={styles.footerContinueWrap}>
              <AuthSetupActionButton
                label={saveLabel}
                onPress={onSave}
                loading={saving}
                disabled={saveDisabled || saving}
                testID="client-edit-save"
              />
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function ClientEditMetaCard({
  clientCode,
  categoryLabel,
  facilityLabel,
}: {
  readonly clientCode: string;
  readonly categoryLabel: string;
  readonly facilityLabel: string;
}) {
  const t = useTranslation();
  const { colors: themeColors } = useThemeMode();

  return (
    <View
      style={[
        styles.metaCard,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
      ]}
      testID="client-edit-meta-card"
    >
      <View style={styles.metaReferenceBlock}>
        <AppText variant="caption" color="secondary" style={styles.metaReferenceLabel}>
          {t.clients.profile.referenceCode}
        </AppText>
        <AppText variant="headingSmall" style={[styles.metaReferenceValue, { color: colors.primaryDark }]}>
          {clientCode}
        </AppText>
      </View>

      <View style={[styles.metaDivider, { backgroundColor: themeColors.border }]} />

      <ClientEditMetaRow
        icon={<ProfileAgeIcon size={16} color={colors.primary} />}
        label={t.clients.profile.clientType}
        value={categoryLabel}
        testID="client-edit-meta-type"
      />
      <ClientEditMetaRow
        icon={<ProfileFacilityIcon size={16} color={colors.primary} />}
        label={t.clients.profile.facility}
        value={facilityLabel}
        testID="client-edit-meta-facility"
      />
    </View>
  );
}

function ClientEditMetaRow({
  icon,
  label,
  value,
  testID,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly testID?: string;
}) {
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.metaRow} testID={testID}>
      <View style={[styles.metaIconWrap, { backgroundColor: themeColors.background }]}>
        {icon}
      </View>
      <View style={styles.metaRowCopy}>
        <AppText variant="caption" color="secondary" style={styles.metaRowLabel}>
          {label}
        </AppText>
        <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function ClientEditStaleBanner({
  heading,
  body,
  reloadLabel,
  onReload,
}: {
  readonly heading: string;
  readonly body: string;
  readonly reloadLabel: string;
  readonly onReload: () => void;
}) {
  return (
    <View style={styles.staleBanner} testID="client-edit-stale-banner">
      <ShieldLockSmallIcon />
      <View style={styles.staleCopy}>
        <AppText variant="bodyStrong" color="warning">
          {heading}
        </AppText>
        <AppText variant="caption" color="secondary">
          {body}
        </AppText>
        <Pressable accessibilityRole="button" onPress={onReload} testID="client-edit-stale-reload">
          <AppText variant="label" style={{ color: colors.primary }}>
            {reloadLabel}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentColumn: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    flexGrow: 1,
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 22,
  },
  body: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  footerBackButton: {
    flex: 0.36,
    minHeight: layout.minTouchTarget + spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  footerBackLabel: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  footerContinueWrap: {
    flex: 0.64,
  },
  metaCard: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.md,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  metaReferenceBlock: {
    gap: spacing.xxs,
  },
  metaReferenceLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  metaReferenceValue: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  metaDivider: {
    height: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  metaRowLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    fontWeight: '600',
  },
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warningBackground,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.warning,
    padding: spacing.md,
  },
  staleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});
