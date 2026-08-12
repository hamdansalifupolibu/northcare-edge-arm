import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { buildCaregiverSlipData } from '../security/buildCaregiverSlip';
import type { SignedPassportClaims } from '../security/signedPassportClaims';
import { ReferralQrCode } from './ReferralQrCode';

type Props = {
  readonly claims: SignedPassportClaims;
  readonly uri: string;
  readonly clientDisplayName?: string | null;
  readonly clientSex?: string | null;
  readonly clientAgeLabel?: string | null;
};

/**
 * On-screen slip preview for devices without ExpoPrint.
 * Workers can screenshot this or use Share caregiver slip — no extra native modules.
 */
export function CaregiverSlipPreview({
  claims,
  uri,
  clientDisplayName,
  clientSex,
  clientAgeLabel,
}: Props) {
  const slip = buildCaregiverSlipData({
    claims,
    uri,
    clientDisplayName,
    clientSex,
    clientAgeLabel,
  });

  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.base,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.mutedSurface,
      }}
      testID="referral-slip-preview"
      accessible
      accessibilityLabel="Caregiver slip preview"
    >
      <AppText variant="label">{slip.brandName}</AppText>
      <AppText variant="caption" color="secondary">
        {slip.tagline}
      </AppText>
      <AppText variant="headingSmall">{slip.clientDisplayName}</AppText>
      {slip.clientSex ? (
        <AppText variant="body">Sex: {slip.clientSex}</AppText>
      ) : null}
      {slip.clientAgeLabel ? (
        <AppText variant="body">Age: {slip.clientAgeLabel}</AppText>
      ) : null}
      <AppText variant="body">Reference: {slip.referenceCode}</AppText>
      <AppText variant="body">From: {slip.sourceFacilityName}</AppText>
      <AppText variant="body">To: {slip.destinationFacilityName}</AppText>
      <AppText variant="body">Reason: {slip.reasonLabel}</AppText>
      <AppText variant="caption" color="secondary">
        Priority: {slip.priorityLabel}
      </AppText>
      <AppText variant="caption" color="secondary">
        Created: {slip.createdAtLabel}
      </AppText>
      <AppText variant="caption" color="secondary">
        Expires: {slip.expiresAtLabel}
      </AppText>
      <ReferralQrCode value={uri} size={180} />
      <AppText variant="caption" color="secondary">
        {slip.receivingFacilityInstruction}
      </AppText>
      <AppText variant="caption" color="secondary">
        {slip.privacyLine}
      </AppText>
    </View>
  );
}
