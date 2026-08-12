import type { ReactNode, RefObject } from 'react';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { colors, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  ReferralBackIcon,
  ReferralChevronDownIcon,
  ReferralChevronRightIcon,
  ReferralClipboardIcon,
  ReferralDocumentSearchIcon,
  ReferralInfoIcon,
  ReferralLinkIcon,
  ReferralLockIcon,
  ReferralQrShieldIcon,
  ReferralShieldCheckIcon,
  ReferralVerifyScanIcon,
} from './ReferralListIcons';

type VerifyPassportHeaderProps = {
  readonly onDeviceLabel: string;
  readonly onBack: () => void;
};

export function VerifyPassportHeader({ onDeviceLabel, onBack }: VerifyPassportHeaderProps) {
  const { colors: themeColors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View style={styles.headerRow} testID="verify-passport-header">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={[styles.headerIconButton, { backgroundColor: themeColors.surface }]}
        testID="verify-passport-back"
      >
        <ReferralBackIcon />
      </Pressable>
      <View style={styles.headerTrailing}>
        <View style={[styles.onDevicePill, { backgroundColor: mintSurface }]}>
          <View style={[styles.onDeviceDot, { backgroundColor: colors.success }]} />
          <AppText variant="caption" style={styles.onDeviceLabel}>
            {onDeviceLabel}
          </AppText>
        </View>
        <View style={[styles.shieldBadge, { backgroundColor: mintSurface }]}>
          <ReferralShieldCheckIcon size={18} />
        </View>
      </View>
    </View>
  );
}

type VerifyOfflineInfoCardProps = {
  readonly title: string;
  readonly body: string;
  readonly notice: string;
};

export function VerifyOfflineInfoCard({ title, body, notice }: VerifyOfflineInfoCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();

  return (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
        },
      ]}
      testID="verify-offline-info-card"
    >
      <View style={styles.infoCardRow}>
        <ReferralQrShieldIcon />
        <View style={styles.infoCardCopy}>
          <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
            {title}
          </AppText>
          <AppText variant="caption" color="secondary" style={styles.infoCardBody}>
            {body}
          </AppText>
        </View>
      </View>
      <View
        style={[
          styles.noticeBox,
          { backgroundColor: isDark ? themeColors.mutedSurface : colors.mutedSurface },
        ]}
      >
        <ReferralInfoIcon />
        <AppText variant="caption" color="secondary" style={styles.noticeText}>
          {notice}
        </AppText>
      </View>
    </View>
  );
}

type VerifyScanPrimaryButtonProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

export function VerifyScanPrimaryButton({
  title,
  subtitle,
  onPress,
  testID = 'referral-verify-scan',
}: VerifyScanPrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.scanPrimaryButton, { opacity: pressed ? 0.92 : 1 }]}
      testID={testID}
    >
      <View style={styles.scanPrimaryIconWrap}>
        <ReferralVerifyScanIcon color={colors.textInverse} />
      </View>
      <View style={styles.scanPrimaryCopy}>
        <AppText variant="bodyStrong" color="inverse" style={styles.scanPrimaryTitle}>
          {title}
        </AppText>
        <AppText variant="caption" color="inverse" style={styles.scanPrimarySubtitle}>
          {subtitle}
        </AppText>
      </View>
      <ReferralChevronRightIcon color={colors.textInverse} />
    </Pressable>
  );
}

export function VerifyOrDivider({ label }: { readonly label: string }) {
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View style={styles.orRow} accessibilityRole="text" accessibilityLabel={label}>
      <View style={[styles.orLine, { backgroundColor: semantic.border.default }]} />
      <View
        style={[
          styles.orBadge,
          {
            borderColor: semantic.border.default,
            backgroundColor: themeColors.surface,
          },
        ]}
      >
        <AppText variant="caption" color="secondary" style={styles.orLabel}>
          {label}
        </AppText>
      </View>
      <View style={[styles.orLine, { backgroundColor: semantic.border.default }]} />
    </View>
  );
}

type VerifyPasteSectionProps = {
  readonly label: string;
  readonly placeholder: string;
  readonly example: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onPastePress: () => void;
  readonly verifyLabel: string;
  readonly onVerifyPress: () => void;
  readonly inputRef?: RefObject<TextInputType | null>;
  readonly testID?: string;
};

export function VerifyPasteSection({
  label,
  placeholder,
  example,
  value,
  onChangeText,
  onPastePress,
  verifyLabel,
  onVerifyPress,
  inputRef,
  testID = 'referral-verify-paste',
}: VerifyPasteSectionProps) {
  const { colors: themeColors, semantic } = useThemeMode();
  const canVerify = value.trim().length > 0;

  return (
    <View style={styles.pasteSection}>
      <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
        {label}
      </AppText>
      <View
        style={[
          styles.pasteInputWrap,
          {
            backgroundColor: themeColors.surface,
            borderColor: semantic.border.default,
          },
        ]}
      >
        <ReferralLinkIcon />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={colors.disabled}
          style={[styles.pasteInput, { color: themeColors.textPrimary }]}
          accessibilityLabel={label}
          testID={testID}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paste from clipboard"
          onPress={onPastePress}
          hitSlop={8}
          style={styles.clipboardButton}
          testID={`${testID}-clipboard`}
        >
          <ReferralClipboardIcon />
        </Pressable>
      </View>
      <AppText variant="caption" color="secondary">
        {example}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={verifyLabel}
        accessibilityState={{ disabled: !canVerify }}
        onPress={onVerifyPress}
        disabled={!canVerify}
        style={({ pressed }) => [
          styles.verifyOutlineButton,
          {
            borderColor: canVerify ? colors.primary : semantic.border.default,
            backgroundColor: themeColors.surface,
            opacity: pressed ? 0.92 : canVerify ? 1 : 0.55,
          },
        ]}
        testID="referral-verify-submit"
      >
        <AppText
          variant="button"
          style={{ color: canVerify ? colors.primaryDark : colors.disabled, fontWeight: '700' }}
        >
          {verifyLabel}
        </AppText>
        <ReferralChevronRightIcon color={canVerify ? colors.primary : colors.disabled} />
      </Pressable>
    </View>
  );
}

type VerifyStoredSearchCardProps = {
  readonly title: string;
  readonly description: string;
  readonly onPress: () => void;
};

export function VerifyStoredSearchCard({ title, description, onPress }: VerifyStoredSearchCardProps) {
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.storedSearchCard,
        {
          backgroundColor: mintSurface,
          borderColor: semantic.border.strong,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID="verify-stored-search"
    >
      <View style={[styles.storedSearchIconWrap, { backgroundColor: themeColors.surface }]}>
        <ReferralDocumentSearchIcon />
      </View>
      <View style={styles.storedSearchCopy}>
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

type VerifyHowItWorksAccordionProps = {
  readonly title: string;
  readonly body: string;
};

export function VerifyHowItWorksAccordion({ title, body }: VerifyHowItWorksAccordionProps) {
  const { colors: themeColors, semantic } = useThemeMode();
  const [expanded, setExpanded] = useState(true);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((open) => !open)}
      style={[
        styles.howItWorksCard,
        {
          backgroundColor: semantic.status.infoBackground,
          borderColor: semantic.border.default,
        },
      ]}
      testID="verify-how-it-works"
    >
      <View style={styles.howItWorksHeader}>
        <View style={[styles.howItWorksIconWrap, { backgroundColor: themeColors.surface }]}>
          <ReferralShieldCheckIcon color={colors.info} />
        </View>
        <View style={styles.howItWorksCopy}>
          <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }}>
            {title}
          </AppText>
          {expanded ? (
            <AppText variant="caption" color="secondary" style={styles.howItWorksBody}>
              {body}
            </AppText>
          ) : null}
        </View>
        <ReferralChevronDownIcon color={colors.primaryDark} size={18} />
      </View>
    </Pressable>
  );
}

export function VerifyPrivacyFooter({ message }: { readonly message: string }) {
  return (
    <View style={styles.privacyFooter} accessibilityRole="text" testID="verify-privacy-footer">
      <ReferralLockIcon />
      <AppText variant="caption" color="secondary" style={styles.privacyText}>
        {message}
      </AppText>
    </View>
  );
}

export function VerifyCameraPanel({ children }: { readonly children: ReactNode }) {
  return (
    <View style={styles.cameraPanel} testID="verify-camera-panel">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  onDevicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  onDeviceDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  onDeviceLabel: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    ...shadows.sm,
  },
  infoCardRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoCardCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  infoCardBody: {
    lineHeight: 18,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  noticeText: {
    flex: 1,
    lineHeight: 18,
  },
  scanPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  scanPrimaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPrimaryCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  scanPrimaryTitle: {
    fontWeight: '800',
  },
  scanPrimarySubtitle: {
    opacity: 0.92,
    lineHeight: 16,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orBadge: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  orLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  pasteSection: {
    gap: spacing.sm,
  },
  pasteInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 88,
  },
  pasteInput: {
    flex: 1,
    minHeight: 56,
    padding: 0,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  clipboardButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  storedSearchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 72,
  },
  storedSearchIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storedSearchCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  howItWorksCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  howItWorksIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  howItWorksBody: {
    lineHeight: 18,
    marginTop: spacing.xxs,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  privacyText: {
    textAlign: 'center',
    lineHeight: 16,
  },
  cameraPanel: {
    height: 280,
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
});
