import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
} from './AuthSetupUiElements';

export type BiometricSetupScreenProps = {
  readonly title: string;
  readonly body: string;
  readonly privateTitle: string;
  readonly privateBody: string;
  readonly enableLabel: string;
  readonly skipLabel: string;
  readonly unavailableMessage?: string;
  readonly settingsHint: string;
  readonly loading?: boolean;
  readonly loadingMessage?: string;
  readonly canEnable: boolean;
  readonly onEnable: () => void;
  readonly onSkip: () => void;
  readonly onBack?: () => void;
  readonly testID: string;
};

function FingerprintIcon({ color }: { readonly color: string }) {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 11 C12 8.5 10 7 8 7 C6 7 4 8.5 4 11"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 11 C12 8.5 14 7 16 7 C18 7 20 8.5 20 11"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 11 V14 C12 16 10.5 17.5 8.5 17.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 14 V17 C12 19 13.5 20.5 15.5 20.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 11 V20"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 14 C8.5 15.5 7.5 16.5 6.5 16.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15.5 14 C15.5 15.5 16.5 16.5 17.5 16.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FingerprintHero() {
  const { colors, isDark } = useThemeMode();

  return (
    <View style={styles.heroWrap} accessibilityElementsHidden>
      {[132, 108, 84].map((size) => (
        <View
          key={`ring-${size}`}
          style={[
            styles.heroRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: isDark ? colors.border : '#C5E3DC',
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.heroCore,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.primaryDark,
          },
        ]}
      >
        <FingerprintIcon color={isDark ? colors.textPrimary : colors.primaryDark} />
        <GoldCheckBadge />
      </View>
    </View>
  );
}

function FingerprintButtonIcon({ color }: { readonly color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 10 V13 C12 14.5 10.8 15.5 9.5 15.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 10 V16 C12 17.5 13 18.5 14.5 18.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 10 V19"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M9 12 C9 10.5 10 9.5 11 9.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15 12 C15 10.5 14 9.5 13 9.5"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BiometricSetupScreen({
  title,
  body,
  privateTitle,
  privateBody,
  enableLabel,
  skipLabel,
  unavailableMessage,
  settingsHint,
  loading = false,
  loadingMessage,
  canEnable,
  onEnable,
  onSkip,
  onBack,
  testID,
}: BiometricSetupScreenProps) {
  const { colors } = useThemeMode();

  return (
    <AuthSetupScreenLayout
      testID={testID}
      loading={loading}
      loadingMessage={loadingMessage}
      onBack={onBack}
      footer={<AuthFooterHint message={settingsHint} />}
    >
      <FingerprintHero />

      <View style={styles.titleBlock}>
        <AppText variant="headingLarge" color="action" align="center" style={styles.title}>
          {title}
        </AppText>
        <GoldAccentBar />
      </View>

      <AppText variant="body" color="secondary" align="center" style={styles.body}>
        {body}
      </AppText>

      <AuthInfoCard title={privateTitle} body={privateBody} />

      {!canEnable && unavailableMessage ? (
        <AppText variant="body" color="secondary" align="center">
          {unavailableMessage}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {canEnable ? (
          <AuthSetupActionButton
            label={enableLabel}
            onPress={onEnable}
            loading={loading}
            leadingIcon={<FingerprintButtonIcon color={colors.textInverse} />}
            testID={`${testID}-enable`}
          />
        ) : null}
        <AuthSetupActionButton
          label={skipLabel}
          variant="secondary"
          onPress={onSkip}
          loading={loading}
          testID={`${testID}-skip`}
        />
      </View>
    </AuthSetupScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroRing: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  heroCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
