import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import type { ClientSex } from '../../../data/domain/enums/clientSex';
import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import type { DuplicateCandidate } from '../domain/duplicateDetection';
import {
  createEmptyRegisterDraft,
  draftHasSubstantialContent,
  type FieldError,
  type RegisterClientDraft,
  validateRegisterDraft,
} from '../application/validation';
import { ClientRegisterCategoryStep } from '../components/ClientRegisterCategoryStep';
import {
  ClientRegisterAgeStep,
  ClientRegisterCaregiverStep,
  ClientRegisterConsentStep,
  ClientRegisterDuplicatesStep,
  ClientRegisterIdentityStep,
  ClientRegisterLocationStep,
} from '../components/ClientRegisterFlowSteps';
import { ClientRegisterReviewStep } from '../components/ClientRegisterReviewStep';
import { ClientRegisterSuccessScreen } from '../components/ClientRegisterSuccessScreen';
import { useClientServices } from '../hooks/useClientServices';

const TOTAL_STEPS = 8;

type StepId =
  | 'category'
  | 'identity'
  | 'age'
  | 'caregiver'
  | 'location'
  | 'consent'
  | 'duplicates'
  | 'review';

const REGISTER_STEPS: StepId[] = [
  'category',
  'identity',
  'age',
  'caregiver',
  'location',
  'consent',
  'duplicates',
  'review',
];

export function ClientRegisterScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { session, touchActivity } = useAuthSession();
  const services = useClientServices();
  const db = useDatabase();
  const [draft, setDraft] = useState<RegisterClientDraft>(() =>
    createEmptyRegisterDraft(session?.facilityId ?? null),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [facilityName, setFacilityName] = useState<string>(session?.facilityName ?? '');

  const steps = REGISTER_STEPS;
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? 'category';

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  const seedFacilityFromSession = useCallback(async () => {
    setFacilityName(session?.facilityName ?? '');
    if (!session?.facilityId?.trim()) {
      return;
    }
    if (!services) {
      // Keep a provisional value until repositories are ready; validation still
      // requires a local EntityId once services can resolve/create the facility.
      setDraft((prev) => ({
        ...prev,
        primaryFacilityId: session.facilityId,
      }));
      return;
    }
    try {
      const facility = await services.ensureAssignedFacility({
        facilityId: session.facilityId,
        name: session.facilityName || 'Assigned facility',
      });
      setDraft((prev) => ({
        ...prev,
        primaryFacilityId: facility.id,
      }));
      setFacilityName(facility.name || session.facilityName || '');
    } catch {
      setDraft((prev) => ({
        ...prev,
        primaryFacilityId: session.facilityId,
      }));
    }
  }, [session?.facilityId, session?.facilityName, services]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void seedFacilityFromSession();
    }, 0);
    return () => clearTimeout(timer);
  }, [seedFacilityFromSession]);

  const patch = useCallback((partial: Partial<RegisterClientDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setFieldErrors([]);
  }, []);

  const errorFor = (field: string) =>
    fieldErrors.find((item) => item.field === field)?.messageKey;

  const resolveError = (key?: string): string => {
    if (!key) {
      return '';
    }
    const map = t.clients.validation as Record<string, string>;
    const short = key.replace('clients.validation.', '');
    return map[short] ?? key;
  };

  const validateCurrentStep = (currentDraft: RegisterClientDraft = draft): boolean => {
    const all = validateRegisterDraft(currentDraft);
    const relevant = filterErrorsForStep(step, all, currentDraft);
    setFieldErrors(relevant);
    return relevant.length === 0;
  };

  const goNext = async () => {
    let currentDraft = draft;
    if (step === 'location' && session?.facilityId?.trim() && services) {
      try {
        const facility = await services.ensureAssignedFacility({
          facilityId: session.facilityId,
          name: session.facilityName || 'Assigned facility',
        });
        currentDraft = { ...draft, primaryFacilityId: facility.id };
        setDraft(currentDraft);
        setFacilityName(facility.name || session.facilityName || '');
      } catch {
        // Fall through to validation, which surfaces facilityRequired when unresolved.
      }
    }
    if (!validateCurrentStep(currentDraft)) {
      return;
    }
    if (step === 'consent' || step === 'duplicates') {
      if (!services) {
        setFieldErrors([
          {
            field: 'form',
            messageKey: 'clients.validation.servicesUnavailable',
          },
        ]);
        return;
      }
      const found = await services.checkPossibleDuplicates(draft);
      setDuplicates(found);
      if (step === 'duplicates') {
        const strong = found.some((d) => d.strength === 'strong');
        if (strong && !draft.duplicateContinueConfirmed) {
          setFieldErrors([
            {
              field: 'duplicates',
              messageKey: 'clients.validation.duplicatesConfirmRequired',
            },
          ]);
          return;
        }
      }
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex((value) => value + 1);
    }
  };

  const save = async () => {
    if (!services || !session) {
      setFieldErrors([
        {
          field: 'form',
          messageKey: 'clients.validation.servicesUnavailable',
        },
      ]);
      return;
    }
    const all = validateRegisterDraft(draft);
    if (all.length > 0) {
      setFieldErrors(all);
      return;
    }
    setSaving(true);
    try {
      const result = await services.registerClient({
        draft,
        accountId: session.accountId,
      });
      setSavedClientId(result.client.id);
    } catch {
      Alert.alert(t.clients.registration.title, t.clients.registration.saveError);
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (!draftHasSubstantialContent(draft) || savedClientId) {
      router.back();
      return;
    }
    Alert.alert(t.clients.registration.abandonTitle, t.clients.registration.abandonBody, [
      { text: t.clients.registration.abandonCancel, style: 'cancel' },
      {
        text: t.clients.registration.abandonConfirm,
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  const goBack = () => {
    setStepIndex((value) => Math.max(0, value - 1));
  };

  const goToStep = (target: StepId) => {
    const index = REGISTER_STEPS.indexOf(target);
    if (index >= 0) {
      setStepIndex(index);
    }
  };

  const resolvedError = (field: string) => {
    const key = errorFor(field);
    return key ? resolveError(key) : undefined;
  };

  const shellProps = (stepNumber: number, stepName: string) => ({
    testID: 'client-register-screen',
    title: t.clients.registration.title,
    subtitle: t.clients.registration.subtitle,
    stepLabel: t.clients.registration.stepLabel(stepNumber, TOTAL_STEPS, stepName),
    stepCurrent: stepNumber,
    stepTotal: TOTAL_STEPS,
    continueLabel: t.clients.registration.next,
    backLabel: t.clients.registration.back,
    securityTitle: t.clients.registration.securityTitle,
    securityBody: t.clients.registration.securityBody,
    onBack: goBack,
    onContinue: () => {
      void goNext();
    },
  });

  if (savedClientId) {
    const displayName = [draft.givenName.trim(), draft.familyName.trim()].filter(Boolean).join(' ');
    return (
      <ClientRegisterSuccessScreen
        draft={draft}
        facilityName={facilityName}
        title={t.clients.registration.successHeading}
        body={
          displayName
            ? t.clients.registration.successBodyNamed(displayName)
            : t.clients.registration.successBody
        }
        offlineTitle={t.clients.registration.successOfflineTitle}
        offlineBody={t.clients.registration.successOfflineBody}
        savedLocallyLabel={t.clients.registration.successSavedLocally}
        viewProfileLabel={t.clients.registration.viewProfile}
        registerAnotherLabel={t.clients.registration.registerAnother}
        scheduleReminderLabel={t.reminders.scheduleAfterRegistration}
        returnToListLabel={t.clients.registration.returnToList}
        goHomeLabel={t.workerShell.goToHome}
        categoryLabel={(category) => t.clients.categories[category]}
        sexLabel={(sex: ClientSex) => t.clients.fields.sexOptions[sex]}
        onBack={() => router.replace('/(worker)/clients')}
        onViewProfile={() => router.replace(`/(worker)/clients/${savedClientId}`)}
        onRegisterAnother={() => {
          setDraft(createEmptyRegisterDraft(null));
          setStepIndex(0);
          setSavedClientId(null);
          setDuplicates([]);
          setFieldErrors([]);
          void seedFacilityFromSession();
        }}
        onScheduleReminder={() =>
          router.push(
            `/(worker)/more/reminders/create?clientId=${savedClientId}` as import('expo-router').Href,
          )
        }
        onReturnToList={() => router.replace('/(worker)/clients')}
        onGoHome={() => router.replace('/(worker)')}
      />
    );
  }

  if (step === 'category') {
    return (
      <ClientRegisterCategoryStep
        testID="client-register-screen"
        title={t.clients.registration.title}
        subtitle={t.clients.registration.subtitle}
        stepLabel={t.clients.registration.stepLabel(1, TOTAL_STEPS, t.clients.registration.stepNames.category)}
        heading={t.clients.registration.categoryHeading}
        instruction={t.clients.registration.categoryInstruction}
        continueLabel={t.clients.registration.next}
        securityTitle={t.clients.registration.securityTitle}
        securityBody={t.clients.registration.securityBody}
        selectedCategory={draft.category}
        onSelectCategory={(category) => patch({ category })}
        onContinue={() => {
          void goNext();
        }}
        onBack={requestClose}
        errorMessage={errorFor('category') ? resolveError(errorFor('category')) : undefined}
        categoryLabel={(category) => t.clients.categories[category]}
        categoryDescription={(category) => t.clients.categoryDescriptions[category]}
      />
    );
  }

  if (step === 'identity') {
    return (
      <ClientRegisterIdentityStep
        {...shellProps(2, t.clients.registration.stepNames.identity)}
        draft={draft}
        onPatch={patch}
        heading={t.clients.registration.identityHeading}
        instruction={t.clients.registration.identityInstruction}
        givenNameLabel={t.clients.fields.givenName}
        familyNameLabel={t.clients.fields.familyName}
        preferredNameLabel={t.clients.fields.preferredName}
        sexLabel={t.clients.fields.sex}
        pregnancyStatusLabel={t.clients.fields.pregnancyStatus}
        estimatedDeliveryDateLabel={t.clients.fields.estimatedDeliveryDate}
        sexOptionLabel={(sex) => t.clients.fields.sexOptions[sex]}
        errorFor={resolvedError}
      />
    );
  }

  if (step === 'age') {
    return (
      <ClientRegisterAgeStep
        {...shellProps(3, t.clients.registration.stepNames.age)}
        draft={draft}
        onPatch={patch}
        heading={t.clients.registration.ageHeading}
        instruction={t.clients.registration.ageInstruction}
        ageExactLabel={t.clients.registration.ageExact}
        ageApproximateLabel={t.clients.registration.ageApproximate}
        ageUnknownLabel={t.clients.registration.ageUnknown}
        dateOfBirthLabel={t.clients.fields.dateOfBirth}
        ageValueLabel={t.clients.fields.ageValue}
        ageUnitLabel={t.clients.fields.ageUnit}
        ageUnitOptionLabel={(unit) => t.clients.fields.ageUnits[unit]}
        errorFor={resolvedError}
      />
    );
  }

  if (step === 'caregiver') {
    return (
      <ClientRegisterCaregiverStep
        {...shellProps(4, t.clients.registration.stepNames.caregiver)}
        draft={draft}
        onPatch={patch}
        heading={t.clients.registration.caregiverHeading}
        instruction={t.clients.registration.caregiverInstruction}
        includeCaregiverLabel={t.clients.registration.includeCaregiverContact}
        caregiverRecommended={t.clients.registration.caregiverRecommended}
        givenNameLabel={t.clients.fields.givenName}
        familyNameLabel={t.clients.fields.familyName}
        caregiverPhoneLabel={t.clients.registration.caregiverPhoneOptional}
        caregiverPhonePlaceholder={t.clients.registration.phonePlaceholder}
        relationshipLabel={t.clients.fields.relationship}
        caregiverConfirmLabel={t.clients.registration.caregiverConfirm}
        relationshipOptionLabel={(relationship) => t.clients.relationships[relationship]}
        errorFor={resolvedError}
      />
    );
  }

  if (step === 'location') {
    return (
      <ClientRegisterLocationStep
        {...shellProps(5, t.clients.registration.stepNames.location)}
        draft={draft}
        onPatch={patch}
        facilityName={facilityName}
        heading={t.clients.registration.locationHeading}
        instruction={t.clients.registration.locationInstruction}
        communityLabel={t.clients.fields.community}
        districtLabel={t.clients.fields.district}
        regionLabel={t.clients.fields.region}
        facilityLabel={t.clients.profile.facility}
        facilityLockedNote={t.clients.registration.facilityLockedNote}
        phoneHeading={t.clients.registration.phoneHeading}
        phoneOptionalLabel={t.clients.registration.phoneOptional}
        phonePlaceholder={t.clients.registration.phonePlaceholder}
        phoneNotAvailableLabel={t.clients.registration.phoneNotAvailable}
        errorFor={resolvedError}
      />
    );
  }

  if (step === 'consent') {
    return (
      <ClientRegisterConsentStep
        {...shellProps(6, t.clients.registration.stepNames.consent)}
        draft={draft}
        onPatch={patch}
        heading={t.clients.registration.consentHeading}
        instruction={t.clients.registration.consentInstruction}
        consentFieldLabel={t.clients.registration.consentFieldLabel}
        consentOptionLabel={(status) => t.clients.consent[status]}
        errorFor={resolvedError}
      />
    );
  }

  if (step === 'duplicates') {
    return (
      <ClientRegisterDuplicatesStep
        {...shellProps(7, t.clients.registration.stepNames.duplicates)}
        draft={draft}
        onPatch={patch}
        duplicates={duplicates}
        heading={t.clients.registration.duplicatesHeading}
        instruction={t.clients.registration.duplicatesInstruction}
        duplicatesNoneTitle={t.clients.registration.duplicatesNoneTitle}
        duplicatesNoneBody={t.clients.registration.duplicatesNoneBody}
        duplicatesFoundTitle={t.clients.registration.duplicatesFoundTitle}
        duplicatesFoundIntro={t.clients.registration.duplicatesFoundIntro}
        duplicatesReviewLabel={t.clients.registration.duplicatesReview}
        duplicatesConfirmStrong={t.clients.registration.duplicatesConfirmStrong}
        duplicatesConfirmLabel={t.clients.registration.duplicatesConfirmLabel}
        onReviewClient={(clientId) => router.push(`/(worker)/clients/${clientId}`)}
        errorFor={resolvedError}
      />
    );
  }

  return (
    <ClientRegisterReviewStep
      {...shellProps(8, t.clients.registration.stepNames.review)}
      draft={draft}
      facilityName={facilityName}
      heading={t.clients.registration.reviewHeading}
      instruction={t.clients.registration.reviewInstruction}
      editLabel={t.clients.registration.reviewEdit}
      categoryLabel={(category) => t.clients.categories[category]}
      consentLabel={(status) => t.clients.consent[status]}
      sexLabel={(sex: ClientSex) => t.clients.fields.sexOptions[sex]}
      relationshipLabel={(relationship) => t.clients.relationships[relationship]}
      phoneNotAvailableLabel={t.clients.registration.phoneNotAvailable}
      ageLabel={t.clients.registration.ageHeading}
      locationLabel={t.clients.profile.community}
      contactLabel={t.clients.registration.reviewContactLabel}
      consentFieldLabel={t.clients.registration.consentFieldLabel}
      facilityLabel={t.clients.profile.facility}
      caregiverLabel={t.clients.registration.caregiverHeading}
      caregiverNotIncludedLabel={t.clients.registration.reviewCaregiverNotIncluded}
      ageUnknownLabel={t.clients.registration.ageUnknown}
      ageApproximateLabel={(value, unit) => t.clients.age.approximate(value, unit)}
      ageBornOnLabel={(date) => t.clients.age.bornOn(date)}
      saveLabel={t.clients.registration.save}
      storageNotReadyMessage={db.readiness !== 'ready' ? 'Local storage is not ready.' : undefined}
      fieldErrors={fieldErrors.map((error) => ({
        field: error.field,
        message: resolveError(error.messageKey),
      }))}
      loading={saving}
      onEditStep={goToStep}
      onContinue={() => {
        void save();
      }}
    />
  );
}

function filterErrorsForStep(
  step: StepId,
  errors: FieldError[],
  draft: RegisterClientDraft,
): FieldError[] {
  const map: Record<StepId, string[]> = {
    category: ['category'],
    identity: ['givenName', 'familyName', 'sex', 'estimatedDeliveryDate'],
    age: ['dateOfBirth', 'approximateAge', 'approximateAgeUnit'],
    caregiver: [
      'caregiverName',
      'relationshipType',
      'caregiverLinkConfirmed',
      'caregiverPhone',
    ],
    location: ['community', 'region', 'primaryFacilityId', 'phoneNumber'],
    consent: ['consentStatus', 'form'],
    duplicates: ['duplicates', 'form'],
    review: errors.map((e) => e.field),
  };
  if (step === 'caregiver' && !draft.includeCaregiver) {
    return [];
  }
  const allowed = new Set(map[step]);
  return errors.filter((error) => allowed.has(error.field));
}
