import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
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
import Svg, { Circle, Path } from 'react-native-svg';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { LoadingState } from '../../../design-system/states/LoadingState';
import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { firstDisplayName } from '../../worker-home/domain/workerGreeting';
import { SwitchWorkspaceIcon } from '../../entry/components/WorkspaceRoleIcons';
import {
  loginBackgroundLayout,
  resolveLoginBackgroundImageStyle,
} from '../content/loginBackgrounds';
import type { AuthRole } from '../domain/types';
import { ImmersivePinEntry } from './ImmersivePinEntry';
import { PinErrorBanner } from './PinErrorBanner';

const HERO_HEIGHT_RATIO = 0.42;

export type ImmersiveUnlockScreenProps = {
  readonly role: AuthRole;
  readonly displayName: string;
  readonly facilityName: string;
  readonly canSwitchWorkspace: boolean;
  readonly pin: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly biometricAvailable: boolean;
  readonly onPinChange: (value: string) => void;
  readonly onBiometricPress: () => void;
  readonly onPasswordPress: () => void;
  readonly onSwitchWorkspace: () => void;
};

function OfflineWifiIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M4 12 C7 8 10 6 12 6 C14 6 17 8 20 12"
        stroke={colors.textSecondary}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M3 3 L21 21" stroke={colors.danger} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function LocationIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 21 C12 21 5 14 5 9.5 C5 6.5 7.5 4 12 4 C16.5 4 19 6.5 19 9.5 C19 14 12 21 12 21 Z"
        fill="none"
        stroke={colors.textInverse}
        strokeWidth={1.6}
      />
      <Circle cx="12" cy="9.5" r="2.5" fill={colors.textInverse} />
    </Svg>
  );
}

function WorkerBadgeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="8" r="3" fill="none" stroke={colors.textInverse} strokeWidth={1.6} />
      <Path
        d="M6 20 C6 16 8.5 14 12 14 C15.5 14 18 16 18 20"
        fill="none"
        stroke={colors.textInverse}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockCircleIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M7 10 V8 C7 5.2 9.2 3 12 3 C14.8 3 17 5.2 17 8 V10"
        fill="none"
        stroke={colors.textInverse}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M6 10 H18 C19.1 10 20 10.9 20 12 V19 C20 20.1 19.1 21 18 21 H6 C4.9 21 4 20.1 4 19 V12 C4 10.9 4.9 10 6 10 Z"
        fill="none"
        stroke={colors.textInverse}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FingerprintIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 3 C8 3 5 6 5 10 V11 M19 11 V10 C19 6 16 3 12 3 M8 15 V13 C8 10.8 9.8 9 12 9 C14.2 9 16 10.8 16 13 V15 M12 21 V17"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PasswordGridIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      {([0, 1, 2] as const).flatMap((row) =>
        ([0, 1, 2] as const).map((col) => (
          <Circle
            key={`${row}-${col}`}
            cx={6 + col * 6}
            cy={6 + row * 6}
            r="1.6"
            fill={colors.primary}
          />
        )),
      )}
    </Svg>
  );
}

function OfflineReadyGraphic() {
  return (
    <Svg width={88} height={56} viewBox="0 0 88 56" accessible={false}>
      <Path d="M8 40 H80" stroke={colors.primary} strokeWidth={1.2} opacity={0.35} />
      <Path
        d="M14 40 L28 28 L42 34 L58 22 L74 30"
        stroke={colors.primary}
        strokeWidth={1.4}
        fill="none"
        opacity={0.5}
      />
      <Circle cx="18" cy="36" r="4" fill={colors.mutedSurface} stroke={colors.primary} strokeWidth={1.2} />
      <Path
        d="M52 24 H62 V38 H52 Z"
        fill={colors.mutedSurface}
        stroke={colors.primary}
        strokeWidth={1.2}
        rx={2}
      />
      <Path d="M55 30 H59 M55 34 H59" stroke={colors.primary} strokeWidth={1} />
      <Path
        d="M66 18 C72 18 76 22 76 28"
        stroke={colors.primary}
        strokeWidth={1.2}
        fill="none"
      />
      <Path d="M64 14 L76 26" stroke={colors.danger} strokeWidth={1.4} />
    </Svg>
  );
}

function CloudCheckIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M6 16 C4 16 3 14.5 3 12.5 C3 10.8 4.2 9.5 6 9.2 C6.5 6.8 8.6 5 11 5 C13.8 5 16 7.2 16 10 C18.2 10.2 20 12 20 14.5 C20 16.5 18.5 18 16.5 18 H8"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M9 14 L11 16 L15 12" stroke={colors.success} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ImmersiveUnlockScreen({
  role,
  displayName,
  facilityName,
  canSwitchWorkspace,
  pin,
  busy,
  error,
  biometricAvailable,
  onPinChange,
  onBiometricPress,
  onPasswordPress,
  onSwitchWorkspace,
}: ImmersiveUnlockScreenProps) {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { isOnline, checking } = useConnectivity();
  const isWorker = role === 'worker';
  const firstName = firstDisplayName(displayName);
  const roleLabel = isWorker ? t.auth.unlockWorkerRole : t.auth.unlockAdminRole;
  const heroHeight = Math.max(windowHeight * HERO_HEIGHT_RATIO, 280);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (!error) {
          scrollRef.current?.scrollTo({ y: 80, animated: true });
        }
      },
    );
    return () => showSub.remove();
  }, [error]);

  useEffect(() => {
    if (!error) {
      return;
    }
    Keyboard.dismiss();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [error]);

  return (
    <View
      style={[styles.root, { backgroundColor: semantic.action.primaryDarker }]}
      testID="unlock"
    >
      <StatusBar style="light" />
      {busy ? <LoadingState message={t.auth.unlocking} testID="unlock-busy" /> : null}

      <ImageBackground
        source={loginBackgroundLayout[role].source}
        style={styles.background}
        imageStyle={resolveLoginBackgroundImageStyle(role, windowHeight, windowWidth)}
        resizeMode="cover"
        accessibilityElementsHidden
      >
        <AppLinearGradient
          colors={['rgba(0,0,0,0.08)', 'transparent', 'rgba(17,33,31,0.68)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </ImageBackground>

      <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.heroTopRow}>
          <NorthCareLogo variant="stacked" size="sm" testID="unlock-hero-logo" />
          <View
            style={styles.offlineBadge}
            accessibilityRole="text"
            accessibilityLabel={
              checking
                ? t.workerHome.connectivityChecking
                : isOnline
                  ? t.workerHome.online
                  : `${t.auth.unlockOfflineBadge}. ${t.auth.unlockLocalMode}`
            }
            testID="unlock-connectivity-badge"
          >
            <OfflineWifiIcon />
            <View style={styles.offlineBadgeCopy}>
              <AppText variant="caption" style={styles.offlineBadgeTitle}>
                {checking ? '…' : isOnline ? t.workerHome.online : t.auth.unlockOfflineBadge}
              </AppText>
              {!checking && !isOnline ? (
                <View style={styles.localModeRow}>
                  <View style={styles.localModeDot} />
                  <AppText variant="caption" color="secondary">
                    {t.auth.unlockLocalMode}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.heroSpacer} />

        <View style={[styles.heroIdentity, { paddingBottom: spacing.xl + 24 }]}>
          <AppText variant="headingLarge" color="inverse">
            {t.auth.unlockWelcomeBack}
          </AppText>
          <AppText variant="displayLarge" color="inverse" style={styles.firstName}>
            {firstName}
          </AppText>
          <View style={styles.metaRow}>
            <LocationIcon />
            <AppText variant="caption" color="inverse" style={styles.metaText}>
              {facilityName}
            </AppText>
          </View>
          <View style={styles.metaRow}>
            <WorkerBadgeIcon />
            <AppText variant="caption" color="inverse" style={styles.metaText}>
              {roleLabel}
            </AppText>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.sheetScroll}
          contentContainerStyle={[
            styles.sheet,
            {
              backgroundColor: isDark ? semantic.background.primary : semantic.surface.primary,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grabber, { backgroundColor: themeColors.border }]} />

          <View style={styles.lockHeaderCentered}>
            <View style={[styles.lockCircleLarge, { backgroundColor: themeColors.primary }]}>
              <LockCircleIcon />
            </View>
            <AppText
              variant="title"
              style={[
                styles.pinTitleCentered,
                { color: isDark ? themeColors.textPrimary : themeColors.primary },
              ]}
            >
              {t.auth.unlockPinTitle}
            </AppText>
            <AppText variant="caption" color="secondary" style={styles.pinSubtitleCentered}>
              {t.auth.unlockPinSubtitle}
            </AppText>
          </View>

          <View style={styles.pinEntryWrap}>
            <ImmersivePinEntry
              value={pin}
              onChange={onPinChange}
              accessibilityLabel={t.auth.unlockWithPin}
              testID="unlock-pin"
              disabled={busy}
              autoFocus={!busy}
              hasError={Boolean(error)}
            />
          </View>

          {error ? <PinErrorBanner message={error} testID="unlock-pin-error" /> : null}

          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={themeColors.primary} />
              <AppText variant="caption" color="secondary">
                {t.auth.unlocking}
              </AppText>
            </View>
          ) : null}

          <View
            style={[
              styles.altAuthContainer,
              {
                backgroundColor: isDark ? themeColors.mutedSurface : '#EEF5F3',
                borderColor: themeColors.border,
              },
            ]}
          >
            {biometricAvailable ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.auth.unlockUseFingerprint}
                onPress={onBiometricPress}
                disabled={busy}
                style={({ pressed }) => [styles.altAuthButton, { opacity: pressed ? 0.85 : 1 }]}
                testID="unlock-biometric"
              >
                <FingerprintIcon />
                <AppText variant="caption" color="action" style={styles.altAuthLabel}>
                  {t.auth.unlockUseFingerprint}
                </AppText>
              </Pressable>
            ) : null}
            {biometricAvailable ? (
              <View style={[styles.altAuthDivider, { backgroundColor: themeColors.border }]} />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.auth.unlockUsePassword}
              onPress={onPasswordPress}
              disabled={busy}
              style={({ pressed }) => [
                styles.altAuthButton,
                !biometricAvailable ? styles.altAuthButtonFull : null,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              testID="unlock-password"
            >
              <PasswordGridIcon />
              <AppText variant="caption" color="action" style={styles.altAuthLabel}>
                {t.auth.unlockUsePassword}
              </AppText>
            </Pressable>
          </View>

          <View
            style={[
              styles.offlineCard,
              {
                backgroundColor: isDark ? themeColors.mutedSurface : '#E8F5F0',
                borderColor: isDark ? themeColors.border : '#B8DDD4',
              },
            ]}
          >
            <CloudCheckIcon />
            <View style={styles.offlineCardCopy}>
              <AppText variant="bodyStrong" color="primary">
                {t.auth.unlockOfflineCardTitle}
              </AppText>
              <AppText variant="caption" color="secondary">
                {t.auth.unlockOfflineCardBody}
              </AppText>
            </View>
            <OfflineReadyGraphic />
          </View>

          {canSwitchWorkspace ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.auth.unlockSwitchWorkspace}
              onPress={onSwitchWorkspace}
              style={styles.switchWorkspace}
              testID="unlock-switch-workspace"
            >
              <SwitchWorkspaceIcon />
              <AppText variant="caption" color="action">
                {t.auth.unlockSwitchWorkspace}
              </AppText>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.auth.changeWorkspace}
              onPress={() => router.replace('/(entry)/workspace-selection')}
              style={styles.switchWorkspace}
              testID="unlock-change-workspace"
            >
              <SwitchWorkspaceIcon />
              <AppText variant="caption" color="action">
                {t.auth.changeWorkspace}
              </AppText>
            </Pressable>
          )}
        </ScrollView>
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
    ...StyleSheet.absoluteFillObject,
    top: 0,
  },
  hero: {
    paddingHorizontal: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: '46%',
  },
  offlineBadgeCopy: {
    gap: 1,
  },
  offlineBadgeTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  localModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  localModeDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
  },
  heroSpacer: {
    flex: 1,
  },
  heroIdentity: {
    gap: spacing.xs,
  },
  firstName: {
    color: '#5EEAD4',
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    opacity: 0.95,
  },
  sheetWrap: {
    flex: 1,
    marginTop: -28,
  },
  sheetScroll: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
    flexGrow: 1,
    ...shadows.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
  },
  lockHeaderCentered: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  lockCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  pinTitleCentered: {
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 20,
  },
  pinSubtitleCentered: {
    textAlign: 'center',
  },
  pinEntryWrap: {
    paddingVertical: spacing.sm,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  altAuthContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  altAuthButton: {
    flex: 1,
    minHeight: layout.minTouchTarget + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  altAuthDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  altAuthButtonFull: {
    flex: 1,
  },
  altAuthLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  offlineCardCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  switchWorkspace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing.xs,
  },
});
