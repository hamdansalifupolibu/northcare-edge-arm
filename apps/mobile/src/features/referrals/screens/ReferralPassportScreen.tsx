import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Share, View } from 'react-native';

import { AppButton, AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { formatAgePresentation, resolveAgePresentation } from '../../clients/domain/agePresentation';
import {
  exportCaregiverSlipPdf,
  isCaregiverSlipPdfAvailable,
  printCaregiverSlip,
} from '../application/caregiverSlipPdf';
import {
  mapReferralServiceError,
  type GeneratedPassport,
  type OfflineVerifiablePassport,
  type ReferralDetails,
} from '../application/createReferralServices';
import { CaregiverSlipPreview } from '../components/CaregiverSlipPreview';
import { ReferralQrCode } from '../components/ReferralQrCode';
import {
  ReferralActionStack,
  ReferralPassportQrHero,
  ReferralPrimaryFooterButton,
  ReferralScreenScaffold,
} from '../components/ReferralOutcomeComponents';
import { resolveRouteParam } from '../domain/resolveRouteParam';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function ReferralPassportScreen() {
  const referralStrings = useReferralStrings();
  const t = useTranslation();
  const { referralId: referralIdParam } = useLocalSearchParams<{ referralId: string }>();
  const referralId = resolveRouteParam(referralIdParam);
  const router = useRouter();
  const { account, touchActivity } = useAuthSession();
  const services = useReferralServices();
  const [details, setDetails] = useState<ReferralDetails | null>(null);
  const [issued, setIssued] = useState<GeneratedPassport | null>(null);
  const [signedOnly, setSignedOnly] = useState<OfflineVerifiablePassport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(async () => {
    if (!services || !referralId || !account) return;
    setLoading(true);
    setError(null);
    try {
      const next = await services.getReferralDetails(referralId);
      setDetails(next);
      if (next && next.referral.status !== 'draft' && next.referral.status !== 'cancelled') {
        try {
          const signed = await services.buildOfflineVerifiablePassport({
            referralId,
            accountId: account.accountId,
          });
          setSignedOnly(signed);
        } catch (passportErr) {
          setError(mapReferralServiceError(passportErr));
        }
      }
    } catch (err) {
      setDetails(null);
      setError(mapReferralServiceError(err));
    } finally {
      setLoading(false);
    }
  }, [services, referralId, account]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    try {
      setPdfAvailable(isCaregiverSlipPdfAvailable());
    } catch {
      setPdfAvailable(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const onIssueOrReissue = useCallback(
    async (reissue: boolean) => {
      if (!services || !account || !referralId) return;
      setBusy(true);
      setError(null);
      try {
        const result = await services.generatePassport({
          referralId,
          accountId: account.accountId,
          reissue,
        });
        setIssued(result);
        setSignedOnly({
          uri: result.uri,
          slipText: result.slipText,
          claims: result.claims,
          referral: result.referral,
        });
        setDetails(await services.getReferralDetails(referralId));
      } catch (err) {
        setError(mapReferralServiceError(err));
      } finally {
        setBusy(false);
      }
    },
    [services, account, referralId],
  );

  const displayUri = issued?.uri ?? signedOnly?.uri ?? null;
  const slipText = issued?.slipText ?? signedOnly?.slipText ?? null;
  const claims = issued?.claims ?? signedOnly?.claims ?? null;

  const clientAgeLabel = useMemo(() => {
    if (!details) return null;
    return formatAgePresentation(
      resolveAgePresentation({
        dateOfBirth: details.clientDateOfBirth,
        approximateAge: details.clientApproximateAge,
        approximateAgeUnit: details.clientApproximateAgeUnit,
      }),
      {
        unknown: t.clients.age.unknown,
        approximate: (value, unit) => t.clients.age.approximate(value, unit),
        bornOn: (date) => t.clients.age.bornOn(date),
      },
    );
  }, [details, t.clients.age]);

  const clientDisplayName = details?.clientDisplayName ?? null;
  const rawSex = details?.clientSex ?? null;
  const clientSex = rawSex ? rawSex.charAt(0).toUpperCase() + rawSex.slice(1) : null;

  const runPdfAction = useCallback(
    async (mode: 'export' | 'print') => {
      if (!displayUri || !claims || !pdfAvailable) return;
      setPdfBusy(true);
      setError(null);
      try {
        const input = {
          claims,
          uri: displayUri,
          clientDisplayName,
          clientSex,
          clientAgeLabel,
        };
        if (mode === 'export') {
          await exportCaregiverSlipPdf(input);
        } else {
          await printCaregiverSlip(input);
        }
      } catch {
        Alert.alert(
          mode === 'export' ? referralStrings.exportPdfSlip : referralStrings.printSlip,
          mode === 'export'
            ? referralStrings.pdfExportFailed
            : referralStrings.printFailed,
        );
      } finally {
        setPdfBusy(false);
      }
    },
    [
      claims,
      clientDisplayName,
      clientSex,
      clientAgeLabel,
      displayUri,
      pdfAvailable,
      referralStrings,
    ],
  );

  const shareSlip = useCallback(() => {
    if (!slipText) return;
    void Share.share({
      message: slipText,
      title: 'NorthCare referral slip',
    });
  }, [slipText]);

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={referralStrings.loading} />
      </AppScreen>
    );
  }

  if (!details && error) {
    return (
      <ReferralScreenScaffold onBack={() => router.back()} testID="referral-passport-screen">
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
        <AppButton label="Try again" onPress={() => void load()} />
      </ReferralScreenScaffold>
    );
  }

  return (
    <ReferralScreenScaffold
      onBack={() => router.back()}
      testID="referral-passport-screen"
      footer={
        <ReferralPrimaryFooterButton
          label={
            details?.activePassport
              ? referralStrings.passportReissue
              : referralStrings.generatePassport
          }
          disabled={busy || details?.referral.status === 'draft'}
          loading={busy}
          onPress={() => void onIssueOrReissue(Boolean(details?.activePassport))}
          testID="referral-passport-issue"
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        <AppText variant="headingLarge" style={{ fontWeight: '800' }}>
          {referralStrings.passportTitle}
        </AppText>
        <AppText variant="body" color="secondary">
          {referralStrings.passportSubtitle}
        </AppText>

        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}

        {displayUri ? (
          <ReferralPassportQrHero
            title={referralStrings.viewPassport}
            privacyNote={referralStrings.passportPrivacy}
            offlineNote={referralStrings.passportNotEncrypted}
            qrNode={<ReferralQrCode value={displayUri} size={240} showCaption={false} />}
          />
        ) : (
          <AppText variant="body" color="secondary">
            {referralStrings.passportEmptyHint}
          </AppText>
        )}

        <ReferralActionStack>
          {displayUri && claims && pdfAvailable ? (
            <>
              <AppButton
                label={referralStrings.exportPdfSlip}
                disabled={pdfBusy}
                loading={pdfBusy}
                onPress={() => void runPdfAction('export')}
                testID="referral-export-pdf"
              />
              <AppButton
                label={referralStrings.printSlip}
                variant="secondary"
                disabled={pdfBusy}
                onPress={() => void runPdfAction('print')}
                testID="referral-print-slip"
              />
            </>
          ) : null}

          {displayUri && claims && !pdfAvailable ? (
            <>
              <AppText variant="caption" color="secondary">
                {referralStrings.pdfUnavailableHint}
              </AppText>
              <AppText variant="caption" color="secondary">
                {referralStrings.pdfUnavailableShareWorks}
              </AppText>
              <AppButton
                label={showPreview ? referralStrings.hideSlipPreview : referralStrings.previewSlip}
                variant="tertiary"
                onPress={() => setShowPreview((prev) => !prev)}
                testID="referral-preview-slip-toggle"
              />
              {showPreview ? (
                <CaregiverSlipPreview
                  claims={claims}
                  uri={displayUri}
                  clientDisplayName={clientDisplayName}
                  clientSex={clientSex}
                  clientAgeLabel={clientAgeLabel}
                />
              ) : null}
            </>
          ) : null}

          {slipText ? (
            <AppButton
              label={referralStrings.shareSlip}
              variant="secondary"
              onPress={shareSlip}
              testID="referral-share-slip"
            />
          ) : null}
        </ReferralActionStack>

        <AppText variant="caption" color="secondary">
          {referralStrings.passportReissueHint}
        </AppText>
        <AppText variant="caption" color="secondary">
          {referralStrings.verifyOfflineCaption}
        </AppText>
      </View>
    </ReferralScreenScaffold>
  );
}
