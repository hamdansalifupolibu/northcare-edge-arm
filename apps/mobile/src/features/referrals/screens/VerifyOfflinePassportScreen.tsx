import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../design-system';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../../worker-home/domain/workerNav';
import { ReferralCelebrationModal } from '../components/ReferralCelebrationModal';
import {
  VerifyCameraPanel,
  VerifyHowItWorksAccordion,
  VerifyOfflineInfoCard,
  VerifyOrDivider,
  VerifyPassportHeader,
  VerifyPasteSection,
  VerifyPrivacyFooter,
  VerifyScanPrimaryButton,
  VerifyStoredSearchCard,
} from '../components/VerifyPassportComponents';
import { mapReferralServiceError } from '../application/createReferralServices';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';
import type { OfflinePassportVerifyResult } from '../security/signedPassportCrypto';

export function VerifyOfflinePassportScreen() {
  const referralStrings = useReferralStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useThemeMode();
  const { session, touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [permission, requestPermission] = useCameraPermissions();
  const [paste, setPaste] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [result, setResult] = useState<OfflinePassportVerifyResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const pasteInputRef = useRef<TextInput>(null);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const runVerify = useCallback(
    (raw: string) => {
      if (!services) return;
      const next = services.verifyOfflinePassport(raw, {
        assignedFacilityId: session?.facilityId,
        assignedFacilityExternalCode: session?.facilityId,
      });
      setResult(next);
      setScanning(false);
      setScanLocked(false);
      setShowSuccessModal(next.ok);
    },
    [services, session?.facilityId],
  );

  const onBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanLocked) return;
      setScanLocked(true);
      runVerify(data);
    },
    [runVerify, scanLocked],
  );

  const startScan = useCallback(() => {
    if (!permission?.granted) {
      void requestPermission().then((res) => {
        if (res.granted) {
          setResult(null);
          setShowSuccessModal(false);
          setScanLocked(false);
          setScanning(true);
        }
      });
      return;
    }
    setResult(null);
    setShowSuccessModal(false);
    setScanLocked(false);
    setScanning(true);
  }, [permission?.granted, requestPermission]);

  const handlePastePress = useCallback(() => {
    pasteInputRef.current?.focus();
  }, []);

  const successClaims = result?.ok ? result.claims : null;

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: themeColors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + WORKER_BOTTOM_NAV_CLEARANCE + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="referral-verify-offline-screen"
      >
        <VerifyPassportHeader
          onDeviceLabel={referralStrings.onDeviceChipLabel}
          onBack={() => router.back()}
        />

        <AppText variant="headingLarge" style={{ color: themeColors.textPrimary, fontWeight: '800' }}>
          {referralStrings.verifyPassportTitle}
        </AppText>

        <VerifyOfflineInfoCard
          title={referralStrings.verifyOfflineCardTitle}
          body={referralStrings.verifyOfflineCardBody}
          notice={referralStrings.verifyOfflineNotice}
        />

        {scanning && permission?.granted ? (
          <VerifyCameraPanel>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onBarcode}
            />
          </VerifyCameraPanel>
        ) : null}

        <VerifyScanPrimaryButton
          title={referralStrings.verifyScanAction}
          subtitle={referralStrings.verifyScanSubtext}
          onPress={startScan}
        />

        <VerifyOrDivider label={referralStrings.verifyOrLabel} />

        <VerifyPasteSection
          label={referralStrings.verifyPasteLabel}
          placeholder={referralStrings.verifyPastePlaceholder}
          example={referralStrings.verifyPasteExample}
          value={paste}
          onChangeText={setPaste}
          onPastePress={handlePastePress}
          verifyLabel={referralStrings.verifyAction}
          onVerifyPress={() => runVerify(paste)}
          inputRef={pasteInputRef}
        />

        {result ? <VerifyResultCard result={result} /> : null}

        <VerifyOrDivider label={referralStrings.verifyOrLabel} />

        <VerifyStoredSearchCard
          title={referralStrings.verifyStoredSearchTitle}
          description={referralStrings.verifyStoredSearchDescription}
          onPress={() => router.push('/(worker)/referrals/scan')}
        />

        <VerifyHowItWorksAccordion
          title={referralStrings.verifyHowItWorksTitle}
          body={referralStrings.verifyHowItWorksBody}
        />

        <VerifyPrivacyFooter message={referralStrings.verifyPrivacyFooter} />
      </ScrollView>

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
            ? result?.ok && result.sealedPatient.status === 'unlocked'
              ? `${result.sealedPatient.displayName} · ${successClaims.srcName} → ${successClaims.dstName}`
              : `${successClaims.srcName} → ${successClaims.dstName}`
            : null
        }
        onContinue={() => setShowSuccessModal(false)}
      />
    </>
  );
}

function VerifyResultCard({
  result,
}: {
  readonly result: OfflinePassportVerifyResult;
}) {
  const referralStrings = useReferralStrings();
  const { colors: themeColors, semantic } = useThemeMode();

  if (!result.ok) {
    return (
      <View
        style={[
          styles.resultCard,
          {
            backgroundColor: semantic.status.urgentBackground,
            borderColor: semantic.status.urgent,
          },
        ]}
        testID="referral-verify-invalid"
      >
        <AppText variant="label">{referralStrings.verifyInvalidTitle}</AppText>
        <AppText variant="body">
          {mapReferralServiceError(result.message)}
        </AppText>
      </View>
    );
  }

  const { claims, sealedPatient } = result;
  return (
    <View
      style={[
        styles.resultCard,
        {
          backgroundColor: semantic.status.stableBackground,
          borderColor: semantic.status.stable,
        },
      ]}
      testID="referral-verify-valid"
    >
      <AppText variant="label">{referralStrings.verifyValidTitle}</AppText>
      <AppText variant="body" style={{ color: themeColors.textPrimary }}>
        Reference: {claims.ref}
      </AppText>
      <AppText variant="body" style={{ color: themeColors.textPrimary }}>
        From: {claims.srcName}
      </AppText>
      <AppText variant="body" style={{ color: themeColors.textPrimary }}>
        To: {claims.dstName}
      </AppText>
      <AppText variant="body" style={{ color: themeColors.textPrimary }}>
        Reason: {claims.reasonLabel}
      </AppText>
      {sealedPatient.status === 'unlocked' ? (
        <AppText variant="body" testID="referral-verify-sealed-unlocked">
          {referralStrings.verifySealedUnlockedLabel}: {sealedPatient.displayName}
        </AppText>
      ) : sealedPatient.status === 'sealedForDestination' ? (
        <AppText variant="body" color="secondary" testID="referral-verify-sealed-locked">
          {referralStrings.verifySealedLockedHint}
        </AppText>
      ) : null}
      {'sex' in claims && claims.sex ? (
        <AppText variant="caption" color="secondary">
          {referralStrings.verifyEnrichmentSex}: {claims.sex}
        </AppText>
      ) : null}
      {'ageBand' in claims && claims.ageBand ? (
        <AppText variant="caption" color="secondary">
          {referralStrings.verifyEnrichmentAgeBand}: {claims.ageBand}
        </AppText>
      ) : null}
      <AppText variant="caption" color="secondary">
        Priority band: {claims.priority}
      </AppText>
      <AppText variant="caption" color="secondary">
        Created (UTC): {claims.createdAt}
      </AppText>
      <AppText variant="caption" color="secondary">
        Expires (UTC): {claims.expiresAt}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  resultCard: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
