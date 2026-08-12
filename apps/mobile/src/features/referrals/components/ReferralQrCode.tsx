import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useReferralStrings } from '../hooks/useReferralStrings';

type Props = {
  readonly value: string;
  readonly size?: number;
  readonly showCaption?: boolean;
};

/**
 * Renders opaque passport URI only. Do not announce the raw token.
 */
export function ReferralQrCode({ value, size = 220, showCaption = true }: Props) {
  const referralStrings = useReferralStrings();
  const { colors: themeColors, semantic } = useThemeMode();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={referralStrings.accessibilityPassportQr}
      style={{
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
      }}
      testID="referral-passport-qr"
    >
      <View
        style={{
          padding: spacing.md,
          borderRadius: radii.lg,
          backgroundColor: themeColors.surface,
          borderWidth: 1,
          borderColor: semantic.border.default,
        }}
      >
        <QRCode
          value={value}
          size={size}
          backgroundColor={themeColors.surface}
          color={colors.primaryDark}
        />
      </View>
      {showCaption ? (
        <AppText variant="caption" color="secondary" style={{ textAlign: 'center', lineHeight: 18 }}>
          {referralStrings.passportPrivacy}
        </AppText>
      ) : null}
    </View>
  );
}
