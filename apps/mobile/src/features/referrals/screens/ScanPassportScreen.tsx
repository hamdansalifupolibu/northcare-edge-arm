import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
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

export function ScanPassportScreen() {
  const referralStrings = useReferralStrings();
const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<PassportResolveResult | null>(null);
  const [offlineVerify, setOfflineVerify] =
    useState<OfflinePassportVerifyResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanLocked, setScanLocked] = useState(false);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const onBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (scanLocked || !services) return;
      setScanLocked(true);
      setError(null);
      setOfflineVerify(null);
      setShowSuccessModal(false);
      try {
        // Signed passports: verify offline and celebrate legitimacy (same modal as Verify screen).
        if (isSignedPassportUri(data.trim())) {
          const verified = services.verifyOfflinePassport(data, {
            assignedFacilityId: session?.facilityId,
            assignedFacilityExternalCode: session?.facilityId,
          });
          setOfflineVerify(verified);
          setResult(null);
          setShowSuccessModal(verified.ok);
          return;
        }
        const resolved = await services.resolvePassportLocally(data);
        setResult(resolved);
      } catch (err) {
        setError(mapReferralServiceError(err));
        setScanLocked(false);
      }
    },
    [services, scanLocked, session?.facilityId],
  );

  const successClaims = offlineVerify?.ok ? offlineVerify.claims : null;

  if (!permission) {
    return (
      <ScrollableAppScreen>
        <AppText variant="body">{referralStrings.loading}</AppText>
      </ScrollableAppScreen>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollableAppScreen>
        <View style={{ gap: spacing.lg }} testID="referral-scan-permission">
          <ScreenTitle>{referralStrings.scanTitle}</ScreenTitle>
          <AppText variant="body">
            {permission.canAskAgain
              ? referralStrings.scanPermissionNeeded
              : referralStrings.scanPermissionDenied}
          </AppText>
          {permission.canAskAgain ? (
            <AppButton
              label={referralStrings.scanGrantPermission}
              onPress={() => {
                void requestPermission();
              }}
            />
          ) : null}
          <AppButton
            label={referralStrings.scanEnterManually}
            variant="secondary"
            onPress={() => router.push('/(worker)/referrals/enter-code')}
          />
        </View>
      </ScrollableAppScreen>
    );
  }

  if (offlineVerify) {
    return (
      <ScrollableAppScreen>
        <View style={{ gap: spacing.lg }} testID="referral-scan-offline-verify">
          <ScreenTitle>{referralStrings.verifyPassportTitle}</ScreenTitle>
          {offlineVerify.ok ? (
            <View
              style={{
                gap: spacing.sm,
                padding: spacing.base,
                borderRadius: radii.md,
                backgroundColor: colors.successBackground,
              }}
              testID="referral-scan-verify-valid"
            >
              <AppText variant="label">{referralStrings.verifyValidTitle}</AppText>
              <AppText variant="body">Reference: {offlineVerify.claims.ref}</AppText>
              <AppText variant="body">From: {offlineVerify.claims.srcName}</AppText>
              <AppText variant="body">To: {offlineVerify.claims.dstName}</AppText>
              <AppText variant="body">Reason: {offlineVerify.claims.reasonLabel}</AppText>
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
              testID="referral-scan-verify-invalid"
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
          <AppButton
            label="Scan again"
            variant="tertiary"
            onPress={() => {
              setOfflineVerify(null);
              setShowSuccessModal(false);
              setScanLocked(false);
            }}
          />
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
              ? offlineVerify?.ok &&
                offlineVerify.sealedPatient.status === 'unlocked'
                ? `${offlineVerify.sealedPatient.displayName} · ${successClaims.srcName} → ${successClaims.dstName}`
                : `${successClaims.srcName} → ${successClaims.dstName}`
              : null
          }
          onContinue={() => setShowSuccessModal(false)}
        />
      </ScrollableAppScreen>
    );
  }

  if (result) {
    return (
      <ScrollableAppScreen>
        <View style={{ gap: spacing.lg }} testID="referral-scan-receipt">
          <ScreenTitle>{referralStrings.receiptTitle}</ScreenTitle>
          <AppText variant="body">{referralStrings.receiptStatusUnchanged}</AppText>
          {result.status === 'resolved' ? (
            <>
              <AppText variant="label">
                {result.details.referral.referenceCode}
              </AppText>
              <ReferralStatusChip status={result.referral.status} />
              <AppText variant="body">{result.details.clientDisplayName}</AppText>
              <AppButton
                label={referralStrings.viewDetails}
                onPress={() =>
                  router.push(`/(worker)/referrals/${result.referral.id}`)
                }
              />
              <AppButton
                label={referralStrings.updateStatusTitle}
                variant="secondary"
                onPress={() =>
                  router.push(
                    `/(worker)/referrals/${result.referral.id}/update-status`,
                  )
                }
              />
            </>
          ) : (
            <AppText variant="body" color="urgent">
              {result.sanitisedMessage}
            </AppText>
          )}
          <AppButton
            label="Scan again"
            variant="tertiary"
            onPress={() => {
              setResult(null);
              setScanLocked(false);
            }}
          />
        </View>
      </ScrollableAppScreen>
    );
  }

  return (
    <View style={{ flex: 1 }} testID="referral-scan-camera">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanLocked ? undefined : onBarcode}
      />
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AppText variant="body">{referralStrings.scanHint}</AppText>
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={referralStrings.scanEnterManually}
          variant="secondary"
          onPress={() => router.push('/(worker)/referrals/enter-code')}
        />
      </View>
    </View>
  );
}
