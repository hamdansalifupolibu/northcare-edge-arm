import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '../../../design-system/text/AppText';
import { spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { AuthSetupScreenLayout } from './AuthSetupScreenLayout';
import {
  AuthFooterHint,
  AuthInfoCard,
  AuthSetupActionButton,
  GoldAccentBar,
  GoldCheckBadge,
  ShieldLockIcon,
} from './AuthSetupUiElements';

export type SetupCompleteScreenProps = {
  readonly title: string;
  readonly body: string;
  readonly readyTitle: string;
  readonly readyBody: string;
  readonly continueLabel: string;
  readonly settingsHint: string;
  readonly loading?: boolean;
  readonly onContinue: () => void;
  readonly testID: string;
};

function DeviceReadyHero() {
  const { colors, isDark } = useThemeMode();

  return (
    <View style={styles.heroWrap} accessibilityElementsHidden>
      <View
        style={[
          styles.heroGlow,
          { backgroundColor: isDark ? colors.mutedSurface : '#E6F3F0' },
        ]}
      />
      {[120, 96].map((size) => (
        <View
          key={`wave-${size}`}
          style={[
            styles.heroWave,
            {
              width: size,
              height: size / 2,
              borderTopLeftRadius: size,
              borderTopRightRadius: size,
              borderColor: isDark ? colors.border : '#C5E3DC',
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.phoneFrame,
          {
            borderColor: colors.primaryDark,
            backgroundColor: colors.surface,
            shadowColor: colors.primaryDark,
          },
        ]}
      >
        <View style={styles.phoneScreen}>
          <Svg width={36} height={36} viewBox="0 0 24 24" accessible={false}>
            <Path
              d="M12 2 L20 6 V11 C20 16 16.5 19.5 12 22 C7.5 19.5 4 16 4 11 V6 Z"
              fill={isDark ? colors.mutedSurface : '#E6F3F0'}
              stroke={colors.primary}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            <Path
              d="M8 12 L11 15 L16 9"
              fill="none"
              stroke={colors.primary}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <GoldCheckBadge />
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.decorDot} accessible={false}>
        <Circle cx="12" cy="12" r="3" fill={colors.accent} opacity={0.5} />
      </Svg>
      <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.decorPlus} accessible={false}>
        <Path d="M12 8 V16 M8 12 H16" stroke={colors.primary} strokeWidth={1.4} opacity={0.35} />
      </Svg>
    </View>
  );
}

export function SetupCompleteScreen({
  title,
  body,
  readyTitle,
  readyBody,
  continueLabel,
  settingsHint,
  loading = false,
  onContinue,
  testID,
}: SetupCompleteScreenProps) {
  return (
    <AuthSetupScreenLayout
      testID={testID}
      footer={<AuthFooterHint message={settingsHint} />}
    >
      <DeviceReadyHero />

      <View style={styles.titleBlock}>
        <AppText variant="headingLarge" color="action" align="center" style={styles.title}>
          {title}
        </AppText>
        <GoldAccentBar />
      </View>

      <AppText variant="body" color="secondary" align="center" style={styles.body}>
        {body}
      </AppText>

      <AuthInfoCard title={readyTitle} body={readyBody} icon={<ShieldLockIcon />} />

      <View style={styles.actions}>
        <AuthSetupActionButton
          label={continueLabel}
          onPress={onContinue}
          loading={loading}
          testID={`${testID}-continue`}
        />
      </View>
    </AuthSetupScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: 160,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.8,
  },
  heroWave: {
    position: 'absolute',
    bottom: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  phoneFrame: {
    width: 72,
    height: 118,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  phoneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  decorDot: {
    position: 'absolute',
    top: 18,
    right: 8,
  },
  decorPlus: {
    position: 'absolute',
    bottom: 24,
    left: 4,
  },
  titleBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontWeight: '800',
  },
  body: {
    maxWidth: 320,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    marginTop: spacing.sm,
  },
});
