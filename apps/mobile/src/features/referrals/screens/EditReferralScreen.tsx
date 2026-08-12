import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import type { Facility } from '../../../data/domain/entities/entities';
import { AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapReferralServiceError } from '../application/createReferralServices';
import type { ReferralReasonDefinition } from '../content/types';
import {
  CaregiverInformedToggle,
  ClinicalNotesField,
  CreateReferralErrorBanner,
  CreateReferralInfoBanner,
  DestinationFacilityCard,
  ReferralReasonCard,
} from '../components/CreateReferralComponents';
import {
  ReferralPrimaryFooterButton,
  ReferralScreenScaffold,
} from '../components/ReferralOutcomeComponents';
import { isReferralEditable } from '../domain/referralInbox';
import { resolveRouteParam } from '../domain/resolveRouteParam';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function EditReferralScreen() {
  const referralStrings = useReferralStrings();
  const { referralId: referralIdParam } = useLocalSearchParams<{ referralId: string }>();
  const referralId = resolveRouteParam(referralIdParam);
  const router = useRouter();
  const { account, touchActivity } = useAuthSession();
  const services = useReferralServices();

  const [facilities, setFacilities] = useState<readonly Facility[]>([]);
  const [reasons, setReasons] = useState<readonly ReferralReasonDefinition[]>([]);
  const [receivingFacilityId, setReceivingFacilityId] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [caregiverInformed, setCaregiverInformed] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [optionalNotes, setOptionalNotes] = useState('');
  const [clinicalSummaryError, setClinicalSummaryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!services || !referralId) return;
    setLoading(true);
    setError(null);
    try {
      const [facilityList, reasonList, details] = await Promise.all([
        services.listActiveFacilities(),
        Promise.resolve(services.listSelectableReasons()),
        services.getReferralDetails(referralId),
      ]);
      if (!details) {
        setError(referralStrings.missing);
        return;
      }
      if (!isReferralEditable(details.referral.status)) {
        setError('This referral cannot be edited in its current status.');
        return;
      }
      setFacilities(facilityList);
      setReasons(reasonList);
      setReceivingFacilityId(details.referral.receivingFacilityId);
      setReasonCode(details.referral.reasonCode);
      setCaregiverInformed(details.referral.caregiverInformed);
      setClinicalSummary(details.referral.workerNotes ?? '');
      setOptionalNotes(details.referral.communicationNotes ?? '');
    } catch (err) {
      setError(mapReferralServiceError(err));
    } finally {
      setLoading(false);
    }
  }, [services, referralId, referralStrings.missing]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const canSave = useMemo(
    () => Boolean(receivingFacilityId && reasonCode && clinicalSummary.trim()),
    [receivingFacilityId, reasonCode, clinicalSummary],
  );

  const onSave = useCallback(async () => {
    if (!services || !account || !referralId) return;
    if (!clinicalSummary.trim()) {
      setClinicalSummaryError(referralStrings.clinicalSummaryRequired);
      return;
    }
    setBusy(true);
    setError(null);
    setClinicalSummaryError(null);
    try {
      const result = await services.editReferral({
        referralId,
        accountId: account.accountId,
        receivingFacilityId,
        reasonCode,
        communicationNotes: optionalNotes.trim() || null,
        workerNotes: clinicalSummary.trim(),
        caregiverInformed,
        reissuePassport: true,
      });
      router.replace(`/(worker)/referrals/${result.referral.id}/passport`);
    } catch (err) {
      setError(mapReferralServiceError(err));
    } finally {
      setBusy(false);
    }
  }, [
    services,
    account,
    referralId,
    receivingFacilityId,
    reasonCode,
    optionalNotes,
    clinicalSummary,
    caregiverInformed,
    referralStrings.clinicalSummaryRequired,
    router,
  ]);

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={referralStrings.loading} />
      </AppScreen>
    );
  }

  return (
    <ReferralScreenScaffold
      onBack={() => router.back()}
      testID="edit-referral-screen"
      footer={
        <ReferralPrimaryFooterButton
          label={referralStrings.editReferralSave}
          onPress={() => void onSave()}
          disabled={!canSave || busy}
          loading={busy}
          testID="edit-referral-save"
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="headingLarge" style={{ fontWeight: '800' }}>
            {referralStrings.editReferral}
          </AppText>
          <AppText variant="body" color="secondary">
            {referralStrings.editReferralSubtitle}
          </AppText>
        </View>

        {error ? <CreateReferralErrorBanner message={error} /> : null}

        <CreateReferralInfoBanner body={referralStrings.destinationHint} />
        {facilities.map((facility) => (
          <DestinationFacilityCard
            key={facility.id}
            facility={facility}
            selected={facility.id === receivingFacilityId}
            onPress={() => setReceivingFacilityId(facility.id)}
          />
        ))}

        <CreateReferralInfoBanner body={referralStrings.reasonHint} />
        {reasons.map((reason) => (
          <ReferralReasonCard
            key={reason.reasonCode}
            reason={reason}
            selected={reason.reasonCode === reasonCode}
            onPress={() => setReasonCode(reason.reasonCode)}
          />
        ))}

        <ClinicalNotesField
          label={referralStrings.clinicalSummaryLabel}
          hint={referralStrings.clinicalSummaryHint}
          placeholder={referralStrings.clinicalSummaryPlaceholder}
          value={clinicalSummary}
          onChangeText={(value) => {
            setClinicalSummary(value);
            if (value.trim()) setClinicalSummaryError(null);
          }}
          required
          error={clinicalSummaryError}
        />

        <ClinicalNotesField
          label={referralStrings.optionalNotesLabel}
          hint={referralStrings.optionalNotesHint}
          placeholder={referralStrings.optionalNotesPlaceholder}
          value={optionalNotes}
          onChangeText={setOptionalNotes}
          testID="edit-referral-optional-notes"
        />

        <CaregiverInformedToggle
          label={referralStrings.caregiverInformedLabel}
          hint={referralStrings.caregiverInformedHint}
          checked={caregiverInformed}
          onChange={setCaregiverInformed}
        />
      </View>
    </ReferralScreenScaffold>
  );
}
