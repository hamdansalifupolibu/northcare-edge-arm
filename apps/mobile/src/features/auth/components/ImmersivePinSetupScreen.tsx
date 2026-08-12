import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  loginBackgroundLayout,
  resolveLoginBackgroundImageStyle,
} from '../content/loginBackgrounds';
import { ImmersivePinEntry } from './ImmersivePinEntry';
import { PinErrorBanner } from './PinErrorBanner';

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly body?: string;
  readonly pin: string;
  readonly error?: string | null;
  readonly continueLabel: string;
  readonly onPinChange: (value: string) => void;
  readonly onContinue: () => void;
  readonly loading?: boolean;
  readonly testID: string;
};

function LockCircleIcon({ color }: { readonly color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M7 10 V8 C7 5.2 9.2 3 12 3 C14.8 3 17 5.2 17 8 V10"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M6 10 H18 C19.1 10 20 10.9 20 12 V19 C20 20.1 19.1 21 18 21 H6 C4.9 21 4 20.1 4 19 V12 C4 10.9 4.9 10 6 10 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ImmersivePinSetupScreen({
  title,
  subtitle,
  body,
  pin,
  error,
  continueLabel,
  onPinChange,
  onContinue,
  loading = false,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, semantic, isDark } = useThemeMode();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const heroHeight = Math.max(windowHeight * 0.38, 280);

  return (
    <View
      style={[styles.root, { backgroundColor: semantic.action.primaryDarker }]}
      testID={testID}
    >
      <StatusBar style="light" />
      <ImageBackground
        source={loginBackgroundLayout.worker.source}
        style={styles.background}
        imageStyle={resolveLoginBackgroundImageStyle('worker', windowHeight, windowWidth)}
        resizeMode="cover"
        accessibilityElementsHidden
      >
        <AppLinearGradient
          colors={
            isDark
              ? ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.15)', 'rgba(15,23,21,0.88)']
              : ['rgba(0,0,0,0.08)', 'transparent', 'rgba(17,33,31,0.68)']
          }
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </ImageBackground>

      <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + spacing.sm }]}>
        <NorthCareLogo variant="stacked" size="sm" />
        <View style={styles.heroSpacer} />
        <View style={[styles.heroCopy, { paddingBottom: spacing.xl + 24 }]}>
          <AppText variant="headingLarge" color="inverse">
            {title}
          </AppText>
          {body ? (
            <AppText variant="body" color="inverse" style={styles.heroBody}>
              {body}
            </AppText>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
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
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <View style={styles.lockHeaderCentered}>
            <View style={[styles.lockCircle, { backgroundColor: colors.primary }]}>
              <LockCircleIcon color={colors.textInverse} />
            </View>
            <AppText
              variant="title"
              style={[styles.pinTitleCentered, { color: isDark ? colors.textPrimary : colors.primary }]}
            >
              {subtitle}
            </AppText>
          </View>
          <ImmersivePinEntry
            value={pin}
            onChange={onPinChange}
            accessibilityLabel={subtitle}
            testID={`${testID}-entry`}
            disabled={loading}
            autoFocus={!loading}
            hasError={Boolean(error)}
          />
          {error ? <PinErrorBanner message={error} testID={`${testID}-error`} /> : null}
          {loading ? (
            <AppText variant="caption" color="secondary" align="center">
              {continueLabel}
            </AppText>
          ) : null}
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
  heroSpacer: {
    flex: 1,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroBody: {
    opacity: 0.95,
  },
  sheetWrap: {
    flex: 1,
    marginTop: -28,
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
  },
  lockHeaderCentered: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTitleCentered: {
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 20,
  },
});
