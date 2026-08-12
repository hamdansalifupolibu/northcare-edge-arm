import { StyleSheet, View } from 'react-native';

import { AGE_UNITS, type AgeUnit } from '../../../data/domain/enums/ageUnit';
import { isClientSex, type ClientSex } from '../../../data/domain/enums/clientSex';
import {
  CONSENT_STATUSES,
  RELATIONSHIP_TYPES,
  type ConsentStatus,
  type RelationshipType,
} from '../../../data/domain/enums/domainEnums';
import { AppText, AppButton, AppTextInput, CheckboxField, FormErrorText, FormLabel } from '../../../design-system';
import type { DuplicateCandidate } from '../domain/duplicateDetection';
import { NORTHERN_GHANA_REGIONS } from '../domain/locationOptions';
import type { RegisterClientDraft } from '../application/validation';
import { ClientRegisterShell } from './ClientRegisterShell';
import {
  RegisterFormError,
  RegisterSelectCard,
  RegisterSexSelector,
  RegisterStepHeading,
  RegisterUnitChipRow,
} from './ClientRegisterSharedUi';
import { spacing } from '../../../theme';

export type RegisterShellConfig = {
  readonly testID?: string;
  readonly title: string;
  readonly subtitle: string;
  readonly stepLabel: string;
  readonly stepCurrent: number;
  readonly stepTotal: number;
  readonly continueLabel: string;
  readonly backLabel: string;
  readonly securityTitle: string;
  readonly securityBody: string;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly continueDisabled?: boolean;
  readonly loading?: boolean;
  readonly showFooterBack?: boolean;
};

type IdentityStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly onPatch: (partial: Partial<RegisterClientDraft>) => void;
  readonly heading: string;
  readonly instruction: string;
  readonly givenNameLabel: string;
  readonly familyNameLabel: string;
  readonly preferredNameLabel: string;
  readonly sexLabel: string;
  readonly pregnancyStatusLabel: string;
  readonly estimatedDeliveryDateLabel: string;
  readonly sexOptionLabel: (sex: ClientSex) => string;
  readonly errorFor: (field: string) => string | undefined;
};

export function ClientRegisterIdentityStep({
  draft,
  onPatch,
  heading,
  instruction,
  givenNameLabel,
  familyNameLabel,
  preferredNameLabel,
  sexLabel,
  pregnancyStatusLabel,
  estimatedDeliveryDateLabel,
  sexOptionLabel,
  errorFor,
  ...shell
}: IdentityStepProps) {
  const selectedSex = isClientSex(draft.sex) ? draft.sex : null;

  return (
    <ClientRegisterShell {...shell} showFooterBack>
      <RegisterStepHeading heading={heading} instruction={instruction} />
      <View style={styles.form}>
        <AppTextInput
          label={givenNameLabel}
          value={draft.givenName}
          onChangeText={(givenName) => onPatch({ givenName })}
          errorText={errorFor('givenName')}
          required
          testID="register-given-name"
        />
        <AppTextInput
          label={familyNameLabel}
          value={draft.familyName}
          onChangeText={(familyName) => onPatch({ familyName })}
          errorText={errorFor('familyName')}
          required
          testID="register-family-name"
        />
        <AppTextInput
          label={preferredNameLabel}
          value={draft.preferredName}
          onChangeText={(preferredName) => onPatch({ preferredName })}
        />
        <RegisterSexSelector
          label={sexLabel}
          required
          selectedSex={selectedSex}
          onSelect={(sex) => onPatch({ sex })}
          errorMessage={errorFor('sex')}
          sexLabel={sexOptionLabel}
        />
        {(draft.category === 'pregnant' || draft.category === 'postnatal') && (
          <>
            <AppTextInput
              label={pregnancyStatusLabel}
              value={draft.pregnancyStatus}
              onChangeText={(pregnancyStatus) => onPatch({ pregnancyStatus })}
            />
            <AppTextInput
              label={estimatedDeliveryDateLabel}
              value={draft.estimatedDeliveryDate}
              onChangeText={(estimatedDeliveryDate) => onPatch({ estimatedDeliveryDate })}
              placeholder="YYYY-MM-DD"
              errorText={errorFor('estimatedDeliveryDate')}
            />
          </>
        )}
      </View>
    </ClientRegisterShell>
  );
}

type AgeStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly onPatch: (partial: Partial<RegisterClientDraft>) => void;
  readonly heading: string;
  readonly instruction: string;
  readonly ageExactLabel: string;
  readonly ageApproximateLabel: string;
  readonly ageUnknownLabel: string;
  readonly dateOfBirthLabel: string;
  readonly ageValueLabel: string;
  readonly ageUnitLabel: string;
  readonly ageUnitOptionLabel: (unit: AgeUnit) => string;
  readonly errorFor: (field: string) => string | undefined;
};

export function ClientRegisterAgeStep({
  draft,
  onPatch,
  heading,
  instruction,
  ageExactLabel,
  ageApproximateLabel,
  ageUnknownLabel,
  dateOfBirthLabel,
  ageValueLabel,
  ageUnitLabel,
  ageUnitOptionLabel,
  errorFor,
  ...shell
}: AgeStepProps) {
  return (
    <ClientRegisterShell {...shell} showFooterBack>
      <RegisterStepHeading heading={heading} instruction={instruction} />
      <View style={styles.stack}>
        <RegisterSelectCard
          label={ageExactLabel}
          selected={draft.ageMode === 'dateOfBirth'}
          onPress={() =>
            onPatch({ ageMode: 'dateOfBirth', approximateAge: '', approximateAgeUnit: null })
          }
          testID="register-age-exact"
        />
        <RegisterSelectCard
          label={ageApproximateLabel}
          selected={draft.ageMode === 'approximateAge'}
          onPress={() => onPatch({ ageMode: 'approximateAge', dateOfBirth: '' })}
          testID="register-age-approximate"
        />
        <RegisterSelectCard
          label={ageUnknownLabel}
          selected={draft.ageMode === 'unknown'}
          onPress={() =>
            onPatch({
              ageMode: 'unknown',
              dateOfBirth: '',
              approximateAge: '',
              approximateAgeUnit: null,
            })
          }
          testID="register-age-unknown"
        />
      </View>
      {draft.ageMode === 'dateOfBirth' ? (
        <AppTextInput
          label={dateOfBirthLabel}
          value={draft.dateOfBirth}
          onChangeText={(dateOfBirth) => onPatch({ dateOfBirth })}
          placeholder="YYYY-MM-DD"
          errorText={errorFor('dateOfBirth')}
          required
          testID="register-dob"
        />
      ) : null}
      {draft.ageMode === 'approximateAge' ? (
        <View style={styles.stack}>
          <AppTextInput
            label={ageValueLabel}
            value={draft.approximateAge}
            onChangeText={(approximateAge) => onPatch({ approximateAge })}
            keyboardType="number-pad"
            errorText={errorFor('approximateAge')}
            required
            testID="register-approx-age"
          />
          <RegisterUnitChipRow
            label={ageUnitLabel}
            required
            units={AGE_UNITS}
            selectedUnit={draft.approximateAgeUnit}
            onSelect={(approximateAgeUnit) => onPatch({ approximateAgeUnit })}
            unitLabel={ageUnitOptionLabel}
            errorMessage={errorFor('approximateAgeUnit')}
          />
        </View>
      ) : null}
    </ClientRegisterShell>
  );
}

type CaregiverStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly onPatch: (partial: Partial<RegisterClientDraft>) => void;
  readonly heading: string;
  readonly instruction: string;
  readonly includeCaregiverLabel: string;
  readonly caregiverRecommended: string;
  readonly givenNameLabel: string;
  readonly familyNameLabel: string;
  readonly caregiverPhoneLabel: string;
  readonly caregiverPhonePlaceholder: string;
  readonly relationshipLabel: string;
  readonly caregiverConfirmLabel: string;
  readonly relationshipOptionLabel: (relationship: RelationshipType) => string;
  readonly errorFor: (field: string) => string | undefined;
};

export function ClientRegisterCaregiverStep({
  draft,
  onPatch,
  heading,
  instruction,
  includeCaregiverLabel,
  caregiverRecommended,
  givenNameLabel,
  familyNameLabel,
  caregiverPhoneLabel,
  caregiverPhonePlaceholder,
  relationshipLabel,
  caregiverConfirmLabel,
  relationshipOptionLabel,
  errorFor,
  ...shell
}: CaregiverStepProps) {
  return (
    <ClientRegisterShell {...shell} showFooterBack>
      <RegisterStepHeading heading={heading} instruction={instruction} />
      <CheckboxField
        label={includeCaregiverLabel}
        checked={draft.includeCaregiver}
        onChange={(includeCaregiver) =>
          onPatch({
            includeCaregiver,
            caregiverLinkConfirmed: includeCaregiver ? draft.caregiverLinkConfirmed : false,
          })
        }
        testID="register-include-caregiver"
      />
      {!draft.includeCaregiver &&
      (draft.category === 'newborn' || draft.category === 'childUnderFive') ? (
        <AppText variant="caption" color="secondary">
          {caregiverRecommended}
        </AppText>
      ) : null}
      {draft.includeCaregiver ? (
        <View style={styles.form}>
          <AppTextInput
            label={givenNameLabel}
            value={draft.caregiverGivenName}
            onChangeText={(caregiverGivenName) => onPatch({ caregiverGivenName })}
            errorText={errorFor('caregiverName')}
            required
            testID="register-caregiver-given-name"
          />
          <AppTextInput
            label={familyNameLabel}
            value={draft.caregiverFamilyName}
            onChangeText={(caregiverFamilyName) => onPatch({ caregiverFamilyName })}
            required
            testID="register-caregiver-family-name"
          />
          <AppTextInput
            label={caregiverPhoneLabel}
            value={draft.caregiverPhone}
            onChangeText={(caregiverPhone) => onPatch({ caregiverPhone })}
            keyboardType="phone-pad"
            autoComplete="off"
            placeholder={caregiverPhonePlaceholder}
            errorText={errorFor('caregiverPhone')}
            testID="register-caregiver-phone"
          />
          <FormLabel required>{relationshipLabel}</FormLabel>
          <View style={styles.stack}>
            {RELATIONSHIP_TYPES.map((relationship) => (
              <RegisterSelectCard
                key={relationship}
                label={relationshipOptionLabel(relationship)}
                selected={draft.relationshipType === relationship}
                onPress={() => onPatch({ relationshipType: relationship as RelationshipType })}
                testID={`register-relationship-${relationship}`}
              />
            ))}
          </View>
          <RegisterFormError message={errorFor('relationshipType')} />
          <CheckboxField
            label={caregiverConfirmLabel}
            checked={draft.caregiverLinkConfirmed}
            onChange={(caregiverLinkConfirmed) => onPatch({ caregiverLinkConfirmed })}
            testID="register-caregiver-confirm"
          />
          <RegisterFormError message={errorFor('caregiverLinkConfirmed')} />
        </View>
      ) : null}
    </ClientRegisterShell>
  );
}

type LocationStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly onPatch: (partial: Partial<RegisterClientDraft>) => void;
  readonly facilityName: string;
  readonly heading: string;
  readonly instruction: string;
  readonly communityLabel: string;
  readonly districtLabel: string;
  readonly regionLabel: string;
  readonly facilityLabel: string;
  readonly facilityLockedNote: string;
  readonly phoneHeading: string;
  readonly phoneOptionalLabel: string;
  readonly phonePlaceholder: string;
  readonly phoneNotAvailableLabel: string;
  readonly errorFor: (field: string) => string | undefined;
};

export function ClientRegisterLocationStep({
  draft,
  onPatch,
  facilityName,
  heading,
  instruction,
  communityLabel,
  districtLabel,
  regionLabel,
  facilityLabel,
  facilityLockedNote,
  phoneHeading,
  phoneOptionalLabel,
  phonePlaceholder,
  phoneNotAvailableLabel,
  errorFor,
  ...shell
}: LocationStepProps) {
  return (
    <ClientRegisterShell {...shell} showFooterBack>
      <RegisterStepHeading heading={heading} instruction={instruction} />
      <View style={styles.form}>
        <AppTextInput
          label={communityLabel}
          value={draft.community}
          onChangeText={(community) => onPatch({ community })}
          errorText={errorFor('community')}
          required
          testID="register-community"
        />
        <AppTextInput
          label={districtLabel}
          value={draft.district}
          onChangeText={(district) => onPatch({ district })}
        />
        <FormLabel required>{regionLabel}</FormLabel>
        <View style={styles.stack}>
          {NORTHERN_GHANA_REGIONS.map((region) => (
            <RegisterSelectCard
              key={region}
              label={region}
              selected={draft.region === region}
              onPress={() => onPatch({ region })}
              testID={`register-region-${region}`}
            />
          ))}
        </View>
        <RegisterFormError message={errorFor('region')} />
        <View style={styles.infoBlock}>
          <AppText variant="bodyStrong">
            {facilityLabel}: {facilityName || '—'}
          </AppText>
          <AppText variant="caption" color="secondary">
            {facilityLockedNote}
          </AppText>
        </View>
        <RegisterFormError message={errorFor('primaryFacilityId')} />
        <AppText variant="title" style={styles.subheading}>
          {phoneHeading}
        </AppText>
        <CheckboxField
          label={phoneNotAvailableLabel}
          checked={draft.phoneNotAvailable}
          onChange={(phoneNotAvailable) =>
            onPatch({ phoneNotAvailable, phoneNumber: phoneNotAvailable ? '' : draft.phoneNumber })
          }
        />
        {!draft.phoneNotAvailable ? (
          <AppTextInput
            label={phoneOptionalLabel}
            value={draft.phoneNumber}
            onChangeText={(phoneNumber) => onPatch({ phoneNumber })}
            keyboardType="phone-pad"
            autoComplete="off"
            placeholder={phonePlaceholder}
            errorText={errorFor('phoneNumber')}
          />
        ) : null}
      </View>
    </ClientRegisterShell>
  );
}

type ConsentStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly onPatch: (partial: Partial<RegisterClientDraft>) => void;
  readonly heading: string;
  readonly instruction: string;
  readonly consentFieldLabel: string;
  readonly consentOptionLabel: (status: ConsentStatus) => string;
  readonly errorFor: (field: string) => string | undefined;
};

export function ClientRegisterConsentStep({
  draft,
  onPatch,
  heading,
  instruction,
  consentFieldLabel,
  consentOptionLabel,
  errorFor,
  ...shell
}: ConsentStepProps) {
  return (
    <ClientRegisterShell {...shell} showFooterBack>
      <RegisterStepHeading heading={heading} instruction={instruction} />
      <FormLabel required>{consentFieldLabel}</FormLabel>
      <View style={styles.stack}>
        {CONSENT_STATUSES.map((status) => (
          <RegisterSelectCard
            key={status}
            label={consentOptionLabel(status as ConsentStatus)}
            selected={draft.consentStatus === status}
            onPress={() => onPatch({ consentStatus: status })}
            testID={`register-consent-${status}`}
          />
        ))}
      </View>
      <RegisterFormError message={errorFor('consentStatus')} />
      <RegisterFormError message={errorFor('form')} />
    </ClientRegisterShell>
  );
}

type DuplicatesStepProps = RegisterShellConfig & {
  readonly draft: RegisterClientDraft;
  readonly onPatch: (partial: Partial<RegisterClientDraft>) => void;
  readonly duplicates: DuplicateCandidate[];
  readonly heading: string;
  readonly instruction: string;
  readonly duplicatesNoneTitle: string;
  readonly duplicatesNoneBody: string;
  readonly duplicatesFoundTitle: string;
  readonly duplicatesFoundIntro: string;
  readonly duplicatesReviewLabel: string;
  readonly duplicatesConfirmStrong: string;
  readonly duplicatesConfirmLabel: string;
  readonly onReviewClient: (clientId: string) => void;
  readonly errorFor: (field: string) => string | undefined;
};

export function ClientRegisterDuplicatesStep({
  draft,
  onPatch,
  duplicates,
  heading,
  instruction,
  duplicatesNoneTitle,
  duplicatesNoneBody,
  duplicatesFoundTitle,
  duplicatesFoundIntro,
  duplicatesReviewLabel,
  duplicatesConfirmStrong,
  duplicatesConfirmLabel,
  onReviewClient,
  errorFor,
  ...shell
}: DuplicatesStepProps) {
  const hasDuplicates = duplicates.length > 0;

  return (
    <ClientRegisterShell {...shell} showFooterBack>
      <RegisterStepHeading heading={heading} instruction={instruction} />
      {!hasDuplicates ? (
        <View style={styles.duplicatesStatusCard}>
          <AppText variant="bodyStrong" color="action">
            {duplicatesNoneTitle}
          </AppText>
          <AppText variant="body" color="secondary">
            {duplicatesNoneBody}
          </AppText>
        </View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.duplicatesStatusCard}>
            <AppText variant="bodyStrong" color="action">
              {duplicatesFoundTitle}
            </AppText>
            <AppText variant="body" color="secondary">
              {duplicatesFoundIntro}
            </AppText>
          </View>
          {duplicates.map((candidate) => (
            <View key={candidate.client.id} style={styles.duplicateCard}>
              <AppText variant="bodyStrong">
                {candidate.client.givenName.charAt(0)}. {candidate.client.familyName.charAt(0)}. ·{' '}
                {candidate.client.clientCode}
              </AppText>
              <AppText variant="caption" color="secondary">
                {candidate.reasons.join(', ')} · {candidate.strength}
              </AppText>
              <AppButton
                label={duplicatesReviewLabel}
                variant="secondary"
                onPress={() => onReviewClient(candidate.client.id)}
                testID={`register-duplicate-review-${candidate.client.id}`}
              />
            </View>
          ))}
        </View>
      )}
      {duplicates.some((d) => d.strength === 'strong') ? (
        <View style={styles.stack}>
          <AppText variant="body" color="secondary">
            {duplicatesConfirmStrong}
          </AppText>
          <CheckboxField
            label={duplicatesConfirmLabel}
            checked={draft.duplicateContinueConfirmed}
            onChange={(duplicateContinueConfirmed) => onPatch({ duplicateContinueConfirmed })}
            testID="register-duplicate-confirm"
          />
        </View>
      ) : null}
      <RegisterFormError message={errorFor('duplicates')} />
      <RegisterFormError message={errorFor('form')} />
    </ClientRegisterShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  infoBlock: {
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  subheading: {
    fontWeight: '700',
  },
  duplicateCard: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C5E3DC',
  },
  duplicatesStatusCard: {
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: 16,
    backgroundColor: '#F3FAF8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C5E3DC',
  },
});
