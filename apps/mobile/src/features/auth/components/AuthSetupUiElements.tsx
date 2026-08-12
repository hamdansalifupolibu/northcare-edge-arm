import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '../../../design-system/text/AppText';
import { colors as lightColors, layout, opacity, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export function GoldAccentBar() {
  return <View style={styles.goldBar} accessibilityElementsHidden />;
}

export function ChevronRightIcon({ color = lightColors.textInverse }: { readonly color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M9 6 L15 12 L9 18"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InfoHintIcon() {
  const { colors } = useThemeMode();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="9" fill="none" stroke={colors.textSecondary} strokeWidth={1.6} />
      <Path
        d="M12 10 V16 M12 7.5 V7.6"
        stroke={colors.textSecondary}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShieldLockIcon() {
  const { colors } = useThemeMode();
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 2 L20 6 V11 C20 16 16.5 19.5 12 22 C7.5 19.5 4 16 4 11 V6 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M9 11 V9.5 C9 8.1 10.3 7 12 7 C13.7 7 15 8.1 15 9.5 V11"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 11 H15.5 C16.3 11 17 11.7 17 12.5 V15.5 C17 16.3 16.3 17 15.5 17 H8.5 C7.7 17 7 16.3 7 15.5 V12.5 C7 11.7 7.7 11 8.5 11 Z"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GoldCheckBadge() {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.goldBadge, { borderColor: colors.surface }]}>
      <Svg width={12} height={12} viewBox="0 0 24 24" accessible={false}>
        <Path
          d="M6 12 L10 16 L18 8"
          fill="none"
          stroke={colors.textInverse}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

type AuthInfoCardProps = {
  readonly title: string;
  readonly body: string;
  readonly icon?: ReactNode;
};

export function AuthInfoCard({ title, body, icon }: AuthInfoCardProps) {
  const { colors, isDark } = useThemeMode();

  return (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: isDark ? colors.mutedSurface : '#F3FAF8',
          borderColor: isDark ? colors.border : '#C5E3DC',
        },
      ]}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: colors.surface }]}>
        {icon ?? <ShieldLockIcon />}
      </View>
      <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
      <View style={styles.infoCopy}>
        <AppText variant="bodyStrong" color="action">
          {title}
        </AppText>
        <AppText variant="caption" color="secondary">
          {body}
        </AppText>
      </View>
    </View>
  );
}

export function AuthFooterHint({ message }: { readonly message: string }) {
  return (
    <View style={styles.footerHint}>
      <InfoHintIcon />
      <AppText variant="caption" color="secondary" style={styles.footerHintText}>
        {message}
      </AppText>
    </View>
  );
}

type AuthSetupActionButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary';
  readonly leadingIcon?: ReactNode;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly testID?: string;
};

export function AuthSetupActionButton({
  label,
  onPress,
  variant = 'primary',
  leadingIcon,
  loading = false,
  disabled = false,
  testID,
}: AuthSetupActionButtonProps) {
  const { colors } = useThemeMode();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  const textColor = isPrimary ? colors.textInverse : colors.primary;
  const chevronColor = isPrimary ? colors.textInverse : colors.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary
          ? { backgroundColor: colors.primaryDark }
          : {
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.primary,
            },
        { opacity: isDisabled ? opacity.disabled : pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.actionLeading}>{leadingIcon ?? null}</View>
      <View style={styles.actionCenter}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <AppText variant="button" style={{ color: textColor, fontWeight: '700' }}>
            {label}
          </AppText>
        )}
      </View>
      <View style={styles.actionTrailing}>
        {!loading ? <ChevronRightIcon color={chevronColor} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  goldBar: {
    width: 56,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: lightColors.accent,
    marginTop: spacing.xs,
  },
  infoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.xxs,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  footerHintText: {
    textAlign: 'center',
  },
  goldBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: lightColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  actionButton: {
    width: '100%',
    minHeight: layout.minTouchTarget + spacing.sm,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  actionLeading: {
    width: 28,
    alignItems: 'flex-start',
  },
  actionCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTrailing: {
    width: 28,
    alignItems: 'flex-end',
  },
});
