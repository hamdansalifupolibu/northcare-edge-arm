import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen, AppText, ScrollableAppScreen, StatusChip } from '../../../design-system';
import { colors, layout, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

export type VoiceToCareShellVariant = 'light' | 'dark';

type VoiceToCareShellProps = {
  readonly variant?: VoiceToCareShellVariant;
  readonly onBack?: () => void;
  readonly rightAction?: ReactNode;
  readonly scrollable?: boolean;
  readonly footer?: ReactNode;
  readonly showOnDeviceChip?: boolean;
  readonly showThemeToggle?: boolean;
  readonly children: ReactNode;
  readonly testID?: string;
};

function VoiceShellHeader({
  isImmersiveDark,
  isAppDark,
  onBack,
  rightAction,
  showOnDeviceChip,
  showThemeToggle,
  testID,
}: {
  readonly isImmersiveDark: boolean;
  readonly isAppDark: boolean;
  readonly onBack?: () => void;
  readonly rightAction?: ReactNode;
  readonly showOnDeviceChip: boolean;
  readonly showThemeToggle: boolean;
  readonly testID?: string;
}) {
  const voiceStrings = useVoiceStrings();
  const useInverseText = isImmersiveDark;

  return (
    <View style={styles.headerRow}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            testID={`${testID ?? 'voice-shell'}-back`}
            style={styles.backButton}
          >
            <AppText variant="headingSmall" color={useInverseText ? 'inverse' : 'action'}>
              ←
            </AppText>
          </Pressable>
        ) : null}
        <AppText
          variant="title"
          color={useInverseText ? 'inverse' : 'primary'}
          accessibilityRole="header"
          style={styles.title}
        >
          {voiceStrings.shellTitle}
        </AppText>
        <View style={styles.headerTrailing}>
          {rightAction ??
            (showOnDeviceChip ? (
              <StatusChip
                label={voiceStrings.onDeviceChip}
                tone={isImmersiveDark || isAppDark ? 'success' : 'offline'}
                testID={`${testID ?? 'voice-shell'}-on-device`}
              />
            ) : null)}
          {showThemeToggle && !isImmersiveDark ? <WorkerThemeToggle /> : null}
        </View>
      </View>
    </View>
  );
}

/**
 * Shared Voice-to-Care layout shell with light ready/review and dark immersive capture states.
 */
export function VoiceToCareShell({
  variant = 'light',
  onBack,
  rightAction,
  scrollable = true,
  footer,
  showOnDeviceChip = true,
  showThemeToggle = true,
  children,
  testID,
}: VoiceToCareShellProps) {
  const { colors: themeColors, semantic, isDark: isAppDark } = useThemeMode();
  const isImmersiveDark = variant === 'dark';
  const Screen = scrollable ? ScrollableAppScreen : AppScreen;

  return (
    <Screen
      testID={testID}
      statusBarStyle={isImmersiveDark ? 'light' : 'auto'}
      background={isImmersiveDark ? 'surface' : 'primary'}
      style={
        isImmersiveDark
          ? { backgroundColor: colors.primaryDarker }
          : { backgroundColor: themeColors.background }
      }
      padded={false}
    >
      <View
        style={[
          styles.headerWrap,
          {
            borderBottomColor: isImmersiveDark ? colors.primaryDark : semantic.border.default,
          },
        ]}
      >
        <VoiceShellHeader
          isImmersiveDark={isImmersiveDark}
          isAppDark={isAppDark}
          onBack={onBack}
          rightAction={rightAction}
          showOnDeviceChip={showOnDeviceChip}
          showThemeToggle={showThemeToggle}
          testID={testID}
        />
      </View>

      <View style={styles.content}>{children}</View>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              borderTopColor: isImmersiveDark ? colors.primaryDark : semantic.border.default,
              backgroundColor: isImmersiveDark ? colors.primaryDarker : semantic.surface.primary,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </Screen>
  );
}

type VoiceLanguageSelectorProps = {
  readonly languageLabel: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

export function VoiceLanguageSelector({
  languageLabel,
  onPress,
  testID = 'voice-language-selector',
}: VoiceLanguageSelectorProps) {
  const voiceStrings = useVoiceStrings();
  const { semantic } = useThemeMode();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${voiceStrings.languageLabel}: ${languageLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageSelector,
        {
          borderColor: semantic.border.default,
          backgroundColor: pressed ? semantic.surface.muted : semantic.surface.primary,
        },
      ]}
    >
      <AppText variant="caption" color="secondary">
        {voiceStrings.languageLabel}
      </AppText>
      <AppText variant="label" color="primary">
        {languageLabel}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenTopSpacing,
    borderBottomWidth: 1,
  },
  headerRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  },
  footer: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: layout.screenBottomSpacing,
    gap: spacing.sm,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  languageSelector: {
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
});
