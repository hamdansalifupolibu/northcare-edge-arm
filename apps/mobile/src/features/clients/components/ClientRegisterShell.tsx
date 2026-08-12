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
import Svg, { Circle, Path } from 'react-native-svg';

import { useKeyboardBottomInset } from '../../../design-system/hooks/useKeyboardBottomInset';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { AuthSetupActionButton } from '../../auth/components/AuthSetupUiElements';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { colors, layout, radii, spacing, themedSecurityBanner } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly stepLabel: string;
  readonly stepCurrent: number;
  readonly stepTotal: number;
  readonly continueLabel: string;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly continueDisabled?: boolean;
  readonly loading?: boolean;
  readonly showFooterBack?: boolean;
  readonly backLabel?: string;
  readonly securityTitle: string;
  readonly securityBody: string;
  readonly children: ReactNode;
  readonly testID?: string;
};

function BackIcon({ strokeColor }: { readonly strokeColor: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M15 6 L9 12 L15 18"
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldLockSmallIcon({ strokeColor }: { readonly strokeColor: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19 12 22 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 11 V9.5 C9 8.1 10.3 7 12 7 C13.7 7 15 8.1 15 9.5 V11"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 11 H15.5 C16.3 11 17 11.7 17 12.5 V15.5 C17 16.3 16.3 17 15.5 17 H8.5 C7.7 17 7 16.3 7 15.5 V12.5 C7 11.7 7.7 11 8.5 11 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClientRegisterShell({
  title,
  subtitle,
  stepLabel,
  stepCurrent,
  stepTotal,
  continueLabel,
  onBack,
  onContinue,
  continueDisabled = false,
  loading = false,
  showFooterBack = false,
  backLabel = 'Back',
  securityTitle,
  securityBody,
  children,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const keyboardOpen = keyboardInset > 0;
  const { colors: themeColors, isDark } = useThemeMode();
  const securityBanner = themedSecurityBanner(themeColors, isDark);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      testID={testID}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
            testID="client-register-back"
          >
            <BackIcon strokeColor={colors.primaryDark} />
          </Pressable>
          <WorkerThemeToggle />
        </View>

        <NorthCareLogo variant="stacked" size="sm" testID="client-register-logo" />

        <AppText variant="headingLarge" style={[styles.title, { color: themeColors.textPrimary }]}>
          {title}
        </AppText>
        <AppText variant="body" color="secondary" style={styles.subtitle}>
          {subtitle}
        </AppText>

        <View style={styles.progressBlock}>
          <AppText variant="caption" style={styles.stepLabel}>
            {stepLabel}
          </AppText>
          <View style={styles.progressTrack}>
            {Array.from({ length: stepTotal }, (_, index) => (
              <View
                key={`register-step-${index + 1}`}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor:
                      index < stepCurrent ? colors.primary : themeColors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

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
            <View
              style={[
                styles.securityBanner,
                {
                  backgroundColor: securityBanner.background,
                  borderColor: securityBanner.border,
                },
              ]}
            >
              <ShieldLockSmallIcon strokeColor={colors.primary} />
              <View style={styles.securityCopy}>
                <AppText variant="bodyStrong" color="action">
                  {securityTitle}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {securityBody}
                </AppText>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
                <Path
                  d="M8 10 V8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 V10"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={1.4}
                />
                <Path
                  d="M7 10 H17 C17.8 10 18.5 10.7 18.5 11.5 V16.5 C18.5 17.3 17.8 18 17 18 H7 C6.2 18 5.5 17.3 5.5 16.5 V11.5 C5.5 10.7 6.2 10 7 10 Z"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={1.4}
                />
              </Svg>
            </View>
          ) : null}
          <View style={showFooterBack ? styles.footerActionsRow : undefined}>
            {showFooterBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={backLabel}
                onPress={onBack}
                style={({ pressed }) => [
                  styles.footerBackButton,
                  {
                    borderColor: colors.primaryDark,
                    backgroundColor: themeColors.surface,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                testID="register-back"
              >
                <AppText variant="button" style={styles.footerBackLabel}>
                  {backLabel}
                </AppText>
              </Pressable>
            ) : null}
            <View style={showFooterBack ? styles.footerContinueWrap : undefined}>
              <AuthSetupActionButton
                label={continueLabel}
                onPress={onContinue}
                loading={loading}
                disabled={continueDisabled}
                testID="register-next"
              />
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
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
  title: {
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  subtitle: {
    lineHeight: 22,
  },
  progressBlock: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepLabel: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
  },
  body: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  securityCopy: {
    flex: 1,
    gap: spacing.xxs,
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
});
