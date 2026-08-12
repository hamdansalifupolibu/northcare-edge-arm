import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import type { Facility } from '../../../data/domain/entities/entities';
import { AppScreen, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapReferralServiceError } from '../application/createReferralServices';
import type { ReferralReasonDefinition } from '../content/types';
import {
  CREATE_REFERRAL_STEPS,
  CaregiverInformedToggle,
  ClinicalNotesField,
  CreateReferralErrorBanner,
  CreateReferralInfoBanner,
  CreateReferralShell,
  DestinationFacilityCard,
  ReferralReasonCard,
  ReviewSummaryRow,
  type CreateReferralStep,
} from '../components/CreateReferralComponents';
import { useReferralServices } from '../hooks/useReferralServices';
import { useReferralStrings } from '../hooks/useReferralStrings';

export function CreateReferralScreen() {
  const referralStrings = useReferralStrings();
  const {
    clientId: clientIdParam,
    riskAssessmentId,
    visitId,
    origin: originParam,
  } = useLocalSearchParams<{
    clientId: string;
    riskAssessmentId?: string;
    visitId?: string;
    origin?: string;
  }>();
  const clientId = Array.isArray(clientIdParam) ? clientIdParam[0] : clientIdParam;
  const router = useRouter();
  const { account, touchActivity } = useAuthSession();
  const services = useReferralServices();

  const origin =
    originParam === 'priorityAssessment' || originParam === 'visitFollowUp'
      ? originParam
      : 'workerInitiated';

  const [step, setStep] = useState<CreateReferralStep>('destination');
  const [facilities, setFacilities] = useState<readonly Facility[]>([]);
  const [reasons, setReasons] = useState<readonly ReferralReasonDefinition[]>([]);
  const [referralId, setReferralId] = useState<string | null>(null);
  const [receivingFacilityId, setReceivingFacilityId] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [caregiverInformed, setCaregiverInformed] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [optionalNotes, setOptionalNotes] = useState('');
  const [clinicalSummaryError, setClinicalSummaryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === receivingFacilityId) ?? null,
    [facilities, receivingFacilityId],
  );
  const selectedReason = useMemo(
    () => reasons.find((r) => r.reasonCode === reasonCode) ?? null,
    [reasons, reasonCode],
  );
  const stepIndex = CREATE_REFERRAL_STEPS.indexOf(step);
  const canGoBack = stepIndex > 0;

  const stepCopy = useMemo(() => {
    if (step === 'destination') {
      return {
        title: referralStrings.destinationTitle,
        subtitle: referralStrings.destinationSubtitle,
      };
    }
    if (step === 'reason') {
      return {
        title: referralStrings.reasonTitle,
        subtitle: referralStrings.reasonSubtitle,
      };
    }
    return {
      title: referralStrings.reviewTitle,
      subtitle: referralStrings.reviewSubtitle,
    };
  }, [referralStrings, step]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!services || !account || !clientId) return;
      if (!account.facilityId) {
        if (!cancelled) {
          setError(referralStrings.missing);
          setBooting(false);
        }
        return;
      }
      try {
        const [facilityList, reasonList] = await Promise.all([
          services.listActiveFacilities(),
          Promise.resolve(services.listSelectableReasons()),
        ]);
        if (cancelled) return;
        setFacilities(facilityList);
        setReasons(reasonList);
        const draft = await services.startReferralDraft({
          clientId,
          accountId: account.accountId,
          sourceFacilityId: account.facilityId,
          origin,
          encounterId: visitId ?? null,
          riskAssessmentId: riskAssessmentId ?? null,
          caregiverInformed: false,
        });
        if (!cancelled) {
          setReferralId(draft.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(mapReferralServiceError(err));
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [services, account, clientId, origin, visitId, riskAssessmentId, referralStrings.missing]);

  const persistDraft = useCallback(async () => {
    if (!services || !account || !referralId) return;
    await services.updateDraft({
      referralId,
      accountId: account.accountId,
      receivingFacilityId,
      reasonCode,
      caregiverInformed,
      transportStatus: 'unknown',
      communicationNotes: optionalNotes.trim() || null,
      workerNotes: clinicalSummary.trim() || null,
    });
  }, [
    services,
    account,
    referralId,
    receivingFacilityId,
    reasonCode,
    caregiverInformed,
    optionalNotes,
    clinicalSummary,
  ]);

  const goNext = useCallback(
    async (next: CreateReferralStep) => {
      setError(null);
      if (step === 'reason' && !clinicalSummary.trim()) {
        setClinicalSummaryError(referralStrings.clinicalSummaryRequired);
        return;
      }
      setClinicalSummaryError(null);
      try {
        await persistDraft();
        setStep(next);
      } catch (err) {
        setError(mapReferralServiceError(err));
      }
    },
    [persistDraft, step, clinicalSummary, referralStrings.clinicalSummaryRequired],
  );

  const goBack = useCallback(() => {
    if (!canGoBack) {
      router.back();
      return;
    }
    setError(null);
    setClinicalSummaryError(null);
    setStep(CREATE_REFERRAL_STEPS[stepIndex - 1]!);
  }, [canGoBack, stepIndex, router]);

  const onConfirm = useCallback(async () => {
    if (!services || !account || !referralId) return;
    if (!clinicalSummary.trim()) {
      setClinicalSummaryError(referralStrings.clinicalSummaryRequired);
      setStep('reason');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await persistDraft();
      await services.confirmReferral({
        referralId,
        accountId: account.accountId,
        generatePassport: true,
      });
      router.replace(
        `/(worker)/clients/${clientId}/referrals/create/success?referralId=${referralId}`,
      );
    } catch (err) {
      setError(mapReferralServiceError(err));
    } finally {
      setBusy(false);
    }
  }, [
    services,
    account,
    referralId,
    persistDraft,
    router,
    clientId,
    clinicalSummary,
    referralStrings.clinicalSummaryRequired,
  ]);

  const onContinue = useCallback(() => {
    if (step === 'destination') {
      void goNext('reason');
      return;
    }
    if (step === 'reason') {
      void goNext('review');
      return;
    }
    void onConfirm();
  }, [step, goNext, onConfirm]);

  const continueDisabled =
    step === 'destination'
      ? !receivingFacilityId
      : step === 'reason'
        ? !reasonCode || !clinicalSummary.trim()
        : busy;

  if (booting) {
    return (
      <AppScreen>
        <LoadingState message={referralStrings.loading} />
      </AppScreen>
    );
  }

  return (
    <CreateReferralShell
      title={stepCopy.title}
      subtitle={stepCopy.subtitle}
      stepIndex={stepIndex}
      stepTotal={CREATE_REFERRAL_STEPS.length}
      continueLabel={step === 'review' ? referralStrings.confirmReferral : referralStrings.continueStep}
      continueDisabled={continueDisabled}
      loading={busy}
      onBack={goBack}
      onContinue={onContinue}
      testID="create-referral-screen"
    >
      {origin === 'workerInitiated' ? (
        <CreateReferralInfoBanner body={referralStrings.noEnginePriorityNote} />
      ) : (
        <CreateReferralInfoBanner body={referralStrings.fromPriority} />
      )}

      {error ? <CreateReferralErrorBanner message={error} /> : null}

      {step === 'destination' ? (
        <View style={{ gap: spacing.md }}>
          <CreateReferralInfoBanner body={referralStrings.destinationHint} />
          {facilities.map((facility) => (
            <DestinationFacilityCard
              key={facility.id}
              facility={facility}
              selected={facility.id === receivingFacilityId}
              onPress={() => setReceivingFacilityId(facility.id)}
            />
          ))}
        </View>
      ) : null}

      {step === 'reason' ? (
        <View style={{ gap: spacing.md }}>
          <CreateReferralInfoBanner body={referralStrings.reasonHint} />
          {reasons.length === 0 ? (
            <CreateReferralErrorBanner message={referralStrings.reasonUnavailable} />
          ) : (
            reasons.map((reason) => (
              <ReferralReasonCard
                key={reason.reasonCode}
                reason={reason}
                selected={reason.reasonCode === reasonCode}
                onPress={() => setReasonCode(reason.reasonCode)}
              />
            ))
          )}
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
            testID="referral-optional-notes"
          />
        </View>
      ) : null}

      {step === 'review' ? (
        <View style={{ gap: spacing.md }}>
          <ReviewSummaryRow
            label={referralStrings.receivingFacilityLabel}
            value={selectedFacility?.name ?? '—'}
          />
          <ReviewSummaryRow
            label={referralStrings.reasonTitle}
            value={selectedReason?.label ?? '—'}
          />
          <ReviewSummaryRow
            label={referralStrings.clinicalSummaryLabel}
            value={clinicalSummary.trim()}
          />
          {optionalNotes.trim() ? (
            <ReviewSummaryRow
              label={referralStrings.optionalNotesLabel}
              value={optionalNotes.trim()}
            />
          ) : null}
          <CaregiverInformedToggle
            label={referralStrings.caregiverInformedLabel}
            hint={referralStrings.caregiverInformedHint}
            checked={caregiverInformed}
            onChange={setCaregiverInformed}
          />
          <CreateReferralInfoBanner body={referralStrings.successBody} />
        </View>
      ) : null}
    </CreateReferralShell>
  );
}
