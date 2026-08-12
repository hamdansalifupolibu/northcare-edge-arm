import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { LoadingState } from '../../../design-system/states/LoadingState';
import { layout, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export type AuthSetupScreenLayoutProps = {
  readonly children: ReactNode;
  readonly testID: string;
  readonly loading?: boolean;
  readonly loadingMessage?: string;
  readonly onBack?: () => void;
  readonly footer?: ReactNode;
};

function BackIcon({ color }: { readonly color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M15 6 L9 12 L15 18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WaveBackground({
  isDark,
  primary,
  accent,
}: {
  readonly isDark: boolean;
  readonly primary: string;
  readonly accent: string;
}) {
  const waveA = isDark ? 'rgba(15, 118, 110, 0.18)' : '#E6F3F0';
  const waveB = isDark ? 'rgba(15, 118, 110, 0.12)' : '#D9EBE7';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Path
          d="M-20 620 C80 560 140 680 260 640 C360 610 420 700 420 700 L420 900 L-20 900 Z"
          fill={waveA}
          opacity={0.85}
        />
        <Path
          d="M-20 680 C100 620 180 740 300 700 C380 670 430 760 430 760 L430 900 L-20 900 Z"
          fill={waveB}
          opacity={0.7}
        />
        <Circle cx="42" cy="120" r="3" fill={accent} opacity={0.45} />
        <Circle cx="330" cy="180" r="2.5" fill={primary} opacity={0.35} />
        <Circle cx="360" cy="420" r="2" fill={accent} opacity={0.4} />
        <Path
          d="M318 96 L322 96 M320 94 L320 98"
          stroke={primary}
          strokeWidth={1.2}
          opacity={0.35}
        />
        <Path
          d="M58 520 L62 520 M60 518 L60 522"
          stroke={accent}
          strokeWidth={1.2}
          opacity={0.35}
        />
      </Svg>
    </View>
  );
}

/**
 * Auth setup scaffold with subtle wave decor, back affordance, and centred logo.
 */
export function AuthSetupScreenLayout({
  children,
  testID,
  loading = false,
  loadingMessage,
  onBack,
  footer,
}: AuthSetupScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeMode();

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      testID={testID}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <WaveBackground isDark={isDark} primary={colors.primary} accent={colors.accent} />
      {loading && loadingMessage ? (
        <LoadingState message={loadingMessage} testID={`${testID}-loading`} />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={styles.backButton}
              hitSlop={8}
              testID={`${testID}-back`}
            >
              <BackIcon color={isDark ? colors.textPrimary : colors.primaryDark} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <NorthCareLogo variant="stacked" size="sm" testID={`${testID}-logo`} />
          <View style={styles.backPlaceholder} />
        </View>

        <View style={styles.body}>{children}</View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  backPlaceholder: {
    width: layout.minTouchTarget,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
});
