import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef } from 'react';
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppButton } from '../../../design-system/buttons/AppButton';
import { AppTextInput } from '../../../design-system/forms/AppTextInput';
import { useKeyboardBottomInset } from '../../../design-system/hooks/useKeyboardBottomInset';
import { LoadingState } from '../../../design-system/states/LoadingState';
import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { borders, layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  loginBackgroundLayout,
  resolveLoginBackgroundImageStyle,
} from '../content/loginBackgrounds';
import type { AuthRole } from '../domain/types';
import { PasswordField } from './PasswordField';
import { AdminRoleIcon, SwitchWorkspaceIcon, WorkerRoleIcon } from '../../entry/components/WorkspaceRoleIcons';

const HERO_HEIGHT_RATIO = 0.46;
const FIELD_SCROLL_OFFSET = 96;

export type ImmersiveLoginScreenProps = {
  readonly expectedRole: AuthRole;
  readonly loginIdentifier: string;
  readonly password: string;
  readonly loading: boolean;
  readonly rememberAccount: boolean;
  readonly lastErrorMessage: string | null;
  readonly onLoginIdentifierChange: (value: string) => void;
  readonly onPasswordChange: (value: string) => void;
  readonly onRememberAccountChange: (value: boolean) => void;
  readonly onSubmit: () => void;
};

function SecureBadgeIcon({ color }: { readonly color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 3 L20 6 V11 C20 16 16.5 19 12 21 C7.5 19 4 16 4 11 V6 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OfflineReadyIcon({ color }: { readonly color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 12 C7 8 10 6 12 6 C14 6 17 8 20 12"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M2 16 H4 M20 16 H22" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function RememberCheckbox({
  checked,
  onToggle,
  label,
  borderColor,
  checkedBackground,
}: {
  readonly checked: boolean;
  readonly onToggle: () => void;
  readonly label: string;
  readonly borderColor: string;
  readonly checkedBackground: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={styles.checkboxRow}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor },
          checked ? { backgroundColor: checkedBackground, borderColor: checkedBackground } : null,
        ]}
      >
        {checked ? (
          <AppText variant="caption" color="inverse">
            ✓
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
    </Pressable>
  );
}

export function ImmersiveLoginScreen({
  expectedRole,
  loginIdentifier,
  password,
  loading,
  rememberAccount,
  lastErrorMessage,
  onLoginIdentifierChange,
  onPasswordChange,
  onRememberAccountChange,
  onSubmit,
}: ImmersiveLoginScreenProps) {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { semantic, isDark } = useThemeMode();
  const keyboardInset = useKeyboardBottomInset();
  const keyboardOpen = keyboardInset > 0;
  const scrollRef = useRef<ScrollView>(null);
  const formSectionY = useRef(0);
  const passwordFieldY = useRef(0);
  const identifierFieldY = useRef(0);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isWorker = expectedRole === 'worker';
  const expandedHeroHeight = Math.max(windowHeight * HERO_HEIGHT_RATIO, 300);
  const collapsedHeroHeight = insets.top + spacing.sm + layout.minTouchTarget + spacing.md;
  const heroHeight = keyboardOpen ? collapsedHeroHeight : expandedHeroHeight;

  const scrollFieldIntoView = useCallback((fieldOffsetInForm: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, formSectionY.current + fieldOffsetInForm - FIELD_SCROLL_OFFSET),
        animated: true,
      });
    });
  }, []);

  const heroTitle = isWorker ? t.auth.welcomeBack : t.auth.adminLoginTitle;
  const heroSubtitle = isWorker ? t.auth.workerLoginSubtitle : t.auth.adminLoginSubtitle;
  const formTitle = isWorker ? t.auth.workerLoginTitle : t.auth.adminFormTitle;
  const formSubtitle = isWorker ? t.auth.workerRoleScopes : t.auth.adminFormSubtitle;
  const submitLabel = isWorker ? t.auth.signIn : t.auth.adminSignInCta;

  return (
    <View
      style={[styles.root, { backgroundColor: semantic.action.primaryDarker }]}
      testID={`${expectedRole}-login`}
    >
      <StatusBar style="light" />
      {loading ? <LoadingState message={t.auth.signingIn} testID="login-loading" /> : null}

      <ImageBackground
        source={loginBackgroundLayout[expectedRole].source}
        style={styles.background}
        imageStyle={resolveLoginBackgroundImageStyle(expectedRole, windowHeight, windowWidth)}
        resizeMode="cover"
        accessibilityElementsHidden
      >
        <AppLinearGradient
          colors={
            isDark
              ? ['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.15)', 'rgba(15, 23, 21, 0.88)']
              : ['rgba(0, 0, 0, 0.08)', 'transparent', 'rgba(17, 33, 31, 0.62)']
          }
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.foreground}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      >
        <View style={[styles.heroOverlay, { height: heroHeight, paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.heroTopRow}>
            <NorthCareLogo variant="stacked" size="sm" testID="login-hero-logo" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.auth.changeWorkspace}
              onPress={() => router.replace('/(entry)/workspace-selection')}
              style={[
                styles.changeWorkspaceButton,
                {
                  backgroundColor: isDark ? 'rgba(26, 36, 34, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: semantic.border.default,
                },
              ]}
              testID="login-change-workspace"
            >
              <SwitchWorkspaceIcon size={16} />
              <AppText variant="caption" color="action">
                {t.auth.changeWorkspace}
              </AppText>
            </Pressable>
          </View>

          {!isWorker ? (
            <View style={styles.secureBadge}>
              <SecureBadgeIcon color={semantic.action.accent} />
              <AppText variant="caption" color="inverse">
                {t.auth.adminSecureBadge}
              </AppText>
            </View>
          ) : null}

          {!keyboardOpen ? (
            <>
              <View style={styles.heroSpacer} />

              <View style={[styles.heroCopy, { paddingBottom: spacing.xl + 20 }]}>
                <AppText variant="headingLarge" color="inverse">
                  {heroTitle}
                </AppText>
                <AppText variant="body" color="inverse" style={styles.heroSubtitle}>
                  {heroSubtitle}
                </AppText>
              </View>
            </>
          ) : null}
        </View>

        <View style={[styles.sheetWrap, keyboardOpen ? styles.sheetWrapExpanded : null]}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? semantic.background.primary : semantic.surface.primary,
                paddingBottom: insets.bottom + spacing.md,
              },
            ]}
          >
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              contentContainerStyle={[
                styles.sheetContent,
                {
                  paddingBottom:
                    insets.bottom + spacing.xl + keyboardInset + (keyboardOpen ? spacing.lg : 0),
                },
              ]}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={Keyboard.dismiss}
            >
              <View style={styles.roleHeader}>
                <View
                  style={[
                    styles.roleIconWrap,
                    { backgroundColor: semantic.surface.muted },
                  ]}
                >
                  {isWorker ? <WorkerRoleIcon size={40} /> : <AdminRoleIcon size={40} />}
                </View>
                <View style={styles.roleCopy}>
                  <AppText variant="title" color="action">
                    {formTitle}
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {formSubtitle}
                  </AppText>
                </View>
              </View>

              <View
                style={styles.form}
                onLayout={(event) => {
                  formSectionY.current = event.nativeEvent.layout.y;
                }}
              >
                <View onLayout={(event) => { identifierFieldY.current = event.nativeEvent.layout.y; }}>
                  <AppTextInput
                    label={t.auth.usernameOrEmail}
                    value={loginIdentifier}
                    onChangeText={onLoginIdentifierChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={t.auth.usernamePlaceholder}
                    testID="login-identifier"
                    onFocus={() => scrollFieldIntoView(identifierFieldY.current)}
                  />
                </View>

                <View onLayout={(event) => { passwordFieldY.current = event.nativeEvent.layout.y; }}>
                  <PasswordField
                    label={t.auth.passwordLabel}
                    value={password}
                    onChangeText={onPasswordChange}
                    testID="login-password"
                    onFocus={() => scrollFieldIntoView(passwordFieldY.current)}
                  />
                </View>

                <View style={styles.formMetaRow}>
                  <RememberCheckbox
                    checked={rememberAccount}
                    onToggle={() => onRememberAccountChange(!rememberAccount)}
                    label={t.auth.rememberAccount}
                    borderColor={semantic.border.default}
                    checkedBackground={semantic.action.primary}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/(auth)/password-recovery')}
                  >
                    <AppText variant="caption" color="action">
                      {t.auth.forgotPassword}
                    </AppText>
                  </Pressable>
                </View>

                {lastErrorMessage ? (
                  <AppText variant="body" color="urgent" accessibilityLiveRegion="polite">
                    {lastErrorMessage}
                  </AppText>
                ) : null}

                <AppButton
                  label={submitLabel}
                  onPress={onSubmit}
                  loading={loading}
                  trailingIcon={
                    <AppText variant="bodyStrong" color="inverse">
                      →
                    </AppText>
                  }
                  testID="login-submit"
                />

                {isWorker ? (
                  <AppButton
                    label={t.administration.activation.activateWithQr}
                    variant="secondary"
                    onPress={() => router.push('/(auth)/activate-scan')}
                    testID="worker-activate-qr"
                  />
                ) : null}
              </View>

              <View
                style={[
                  styles.offlineNotice,
                  { backgroundColor: semantic.background.secondary },
                ]}
              >
                <OfflineReadyIcon color={semantic.text.secondary} />
                <View style={styles.offlineCopy}>
                  <AppText variant="bodyStrong" color="primary">
                    {t.auth.offlineReadyTitle}
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {isWorker ? t.auth.offlineReadyBody : t.auth.adminOfflineNote}
                  </AppText>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFill,
    top: 0,
  },
  foreground: {
    flex: 1,
  },
  heroOverlay: {
    paddingHorizontal: spacing.lg,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  changeWorkspaceButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: borders.widthThin,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  secureBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroSpacer: {
    flex: 1,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroSubtitle: {
    opacity: 0.95,
  },
  sheetWrap: {
    flex: 1,
    marginTop: -32,
  },
  sheetWrapExpanded: {
    marginTop: -12,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    flex: 1,
    ...shadows.md,
  },
  sheetContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  roleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleIconWrap: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  roleCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  form: {
    gap: spacing.md,
  },
  formMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: borders.widthThin,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  offlineNotice: {
    alignItems: 'flex-start',
    borderRadius: radii.card,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  offlineCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
