import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  AppTextInput,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import {
  mapReferralServiceError,
  type PassportResolveResult,
} from '../application/createReferralServices';
import { ReferralCelebrationModal } from '../components/ReferralCelebrationModal';
import { ReferralStatusChip } from '../components/ReferralStatusChip';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';
import {
  isSignedPassportUri,
  type OfflinePassportVerifyResult,
} from '../security/signedPassportCrypto';
import { consumePendingPassportToken } from '../security/transientPassportTokenStore';

export function EnterPassportCodeScreen() {
  const referralStrings = useReferralStrings();
const router = useRouter();
  const { session } = useAuthSession();
  const services = useReferralServices();
  const [code, setCode] = useState(() => consumePendingPassportToken() ?? '');
  const [result, setResult] = useState<PassportResolveResult | null>(null);
  const [offlineVerify, setOfflineVerify] =
    useState<OfflinePassportVerifyResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const successClaims = offlineVerify?.ok ? offlineVerify.claims : null;

  return (
    <ScrollableAppScreen>
      <View style={{ gap: spacing.lg }} testID="referral-enter-code-screen">
        <ScreenTitle>{referralStrings.enterCodeTitle}</ScreenTitle>
        <AppText variant="caption" color="secondary">
          {referralStrings.enterCodeHint}
        </AppText>
        <AppTextInput
          label="Passport code or URI"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={referralStrings.resolveAction}
          disabled={busy || !code.trim()}
          onPress={() => {
            if (!services) return;
            setBusy(true);
            setError(null);
            setOfflineVerify(null);
            setShowSuccessModal(false);
            setResult(null);
            const trimmed = code.trim();
            if (isSignedPassportUri(trimmed)) {
              const verified = services.verifyOfflinePassport(trimmed, {
                assignedFacilityId: session?.facilityId,
                assignedFacilityExternalCode: session?.facilityId,
              });
              setOfflineVerify(verified);
              setShowSuccessModal(verified.ok);
              setBusy(false);
              return;
            }
            void services
              .resolvePassportLocally(trimmed)
              .then(setResult)
              .catch((err) => setError(mapReferralServiceError(err)))
              .finally(() => setBusy(false));
          }}
          testID="referral-resolve-code"
        />
        {offlineVerify ? (
          <View style={{ gap: spacing.md }}>
            {offlineVerify.ok ? (
              <View
                style={{
                  gap: spacing.sm,
                  padding: spacing.base,
                  borderRadius: radii.md,
                  backgroundColor: colors.successBackground,
                }}
                testID="referral-enter-verify-valid"
              >
                <AppText variant="label">{referralStrings.verifyValidTitle}</AppText>
                <AppText variant="body">
                  Reference: {offlineVerify.claims.ref}
                </AppText>
                <AppText variant="body">
                  From: {offlineVerify.claims.srcName}
                </AppText>
                <AppText variant="body">To: {offlineVerify.claims.dstName}</AppText>
                {offlineVerify.sealedPatient.status === 'unlocked' ? (
                  <AppText variant="body">
                    {referralStrings.verifySealedUnlockedLabel}:{' '}
                    {offlineVerify.sealedPatient.displayName}
                  </AppText>
                ) : offlineVerify.sealedPatient.status === 'sealedForDestination' ? (
                  <AppText variant="body" color="secondary">
                    {referralStrings.verifySealedLockedHint}
                  </AppText>
                ) : null}
                <AppText variant="caption" color="secondary">
                  {referralStrings.verifyOfflineCaption}
                </AppText>
              </View>
            ) : (
              <View
                style={{
                  gap: spacing.sm,
                  padding: spacing.base,
                  borderRadius: radii.md,
                  backgroundColor: colors.dangerBackground,
                }}
                testID="referral-enter-verify-invalid"
              >
                <AppText variant="label">{referralStrings.verifyInvalidTitle}</AppText>
                <AppText variant="body">
                  {mapReferralServiceError(offlineVerify.message)}
                </AppText>
              </View>
            )}
            <AppButton
              label={referralStrings.verifyPassport}
              variant="secondary"
              onPress={() => router.push('/(worker)/referrals/verify')}
            />
          </View>
        ) : null}
        {result ? (
          <View style={{ gap: spacing.md }}>
            <AppText variant="body">{referralStrings.receiptStatusUnchanged}</AppText>
            {result.status === 'resolved' ? (
              <>
                <AppText variant="label">
                  {result.details.referral.referenceCode}
                </AppText>
                <ReferralStatusChip status={result.referral.status} />
                <AppButton
                  label={referralStrings.viewDetails}
                  onPress={() =>
                    router.push(`/(worker)/referrals/${result.referral.id}`)
                  }
                />
              </>
            ) : (
              <AppText variant="body" color="urgent">
                {result.sanitisedMessage}
              </AppText>
            )}
          </View>
        ) : null}
      </View>

      <ReferralCelebrationModal
        visible={showSuccessModal && Boolean(successClaims)}
        title={referralStrings.verifySuccessModalTitle}
        body={referralStrings.verifySuccessModalBody}
        continueLabel={referralStrings.verifySuccessModalContinue}
        accessibilityLabel={referralStrings.verifySuccessModalA11y}
        testID="referral-verify-success-modal"
        continueTestID="referral-verify-success-continue"
        detailPrimary={
          successClaims
            ? `${referralStrings.referenceLabel}: ${successClaims.ref}`
            : null
        }
        detailSecondary={
          successClaims
            ? offlineVerify?.ok && offlineVerify.sealedPatient.status === 'unlocked'
              ? `${offlineVerify.sealedPatient.displayName} · ${successClaims.srcName} → ${successClaims.dstName}`
              : `${successClaims.srcName} → ${successClaims.dstName}`
            : null
        }
        onContinue={() => setShowSuccessModal(false)}
      />
    </ScrollableAppScreen>
  );
}
