import { isAgeUnit, type AgeUnit } from '../../../data/domain/enums/ageUnit';
import { isClientCategory, type ClientCategory } from '../../../data/domain/enums/clientCategory';
import { isClientSex } from '../../../data/domain/enums/clientSex';
import {
  CONSENT_STATUSES,
  RELATIONSHIP_TYPES,
  type ConsentStatus,
  type RelationshipType,
} from '../../../data/domain/enums/domainEnums';
import { isDateOnly } from '../../../data/domain/value-objects/dateOnly';
import { isEntityId } from '../../../data/domain/value-objects/EntityId';

export type FieldError = {
  readonly field: string;
  readonly messageKey: string;
};

export type RegisterClientDraft = {
  readonly category: ClientCategory | null;
  readonly givenName: string;
  readonly familyName: string;
  readonly preferredName: string;
  readonly sex: string;
  readonly ageMode: 'dateOfBirth' | 'approximateAge' | 'unknown';
  readonly dateOfBirth: string;
  readonly approximateAge: string;
  readonly approximateAgeUnit: AgeUnit | null;
  readonly pregnancyStatus: string;
  readonly estimatedDeliveryDate: string;
  readonly phoneNumber: string;
  readonly phoneNotAvailable: boolean;
  readonly community: string;
  readonly district: string;
  readonly region: string;
  readonly primaryFacilityId: string | null;
  readonly consentStatus: ConsentStatus | null;
  readonly notes: string;
  readonly includeCaregiver: boolean;
  readonly caregiverGivenName: string;
  readonly caregiverFamilyName: string;
  readonly caregiverPhone: string;
  readonly caregiverCommunity: string;
  readonly relationshipType: RelationshipType | null;
  readonly caregiverLinkConfirmed: boolean;
  readonly duplicateContinueConfirmed: boolean;
};

export function createEmptyRegisterDraft(
  facilityId: string | null = null,
): RegisterClientDraft {
  return {
    category: null,
    givenName: '',
    familyName: '',
    preferredName: '',
    sex: '',
    ageMode: 'unknown',
    dateOfBirth: '',
    approximateAge: '',
    approximateAgeUnit: null,
    pregnancyStatus: '',
    estimatedDeliveryDate: '',
    phoneNumber: '',
    phoneNotAvailable: false,
    community: '',
    district: '',
    region: '',
    primaryFacilityId: facilityId,
    consentStatus: null,
    notes: '',
    includeCaregiver: false,
    caregiverGivenName: '',
    caregiverFamilyName: '',
    caregiverPhone: '',
    caregiverCommunity: '',
    relationshipType: null,
    caregiverLinkConfirmed: false,
    duplicateContinueConfirmed: false,
  };
}

/** Soft UI hint only — caregiver is never hard-required to complete registration. */
export function caregiverRecommendedForCategory(category: ClientCategory | null): boolean {
  return category === 'newborn' || category === 'childUnderFive';
}

/** @deprecated Use caregiverRecommendedForCategory — caregiver is optional for all categories. */
export function caregiverRequiredForCategory(category: ClientCategory | null): boolean {
  return caregiverRecommendedForCategory(category);
}

function isValidOptionalPhone(value: string): boolean {
  const digits = value.replace(/\D+/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function validateRegisterDraft(draft: RegisterClientDraft): FieldError[] {
  const errors: FieldError[] = [];

  if (!draft.category || !isClientCategory(draft.category)) {
    errors.push({ field: 'category', messageKey: 'clients.validation.categoryRequired' });
  }
  if (!draft.givenName.trim()) {
    errors.push({ field: 'givenName', messageKey: 'clients.validation.givenNameRequired' });
  }
  if (!draft.familyName.trim()) {
    errors.push({ field: 'familyName', messageKey: 'clients.validation.familyNameRequired' });
  }
  if (!isClientSex(draft.sex)) {
    errors.push({ field: 'sex', messageKey: 'clients.validation.sexRequired' });
  }

  if (draft.ageMode === 'dateOfBirth') {
    if (!draft.dateOfBirth || !isDateOnly(draft.dateOfBirth)) {
      errors.push({ field: 'dateOfBirth', messageKey: 'clients.validation.dateOfBirthInvalid' });
    }
  } else if (draft.ageMode === 'approximateAge') {
    const age = Number(draft.approximateAge);
    if (!Number.isFinite(age) || age < 0 || !Number.isInteger(age)) {
      errors.push({
        field: 'approximateAge',
        messageKey: 'clients.validation.approximateAgeInvalid',
      });
    }
    if (!isAgeUnit(draft.approximateAgeUnit)) {
      errors.push({
        field: 'approximateAgeUnit',
        messageKey: 'clients.validation.approximateAgeUnitRequired',
      });
    }
  }

  if (draft.estimatedDeliveryDate && !isDateOnly(draft.estimatedDeliveryDate)) {
    errors.push({
      field: 'estimatedDeliveryDate',
      messageKey: 'clients.validation.dateInvalid',
    });
  }

  if (!draft.community.trim()) {
    errors.push({ field: 'community', messageKey: 'clients.validation.communityRequired' });
  }
  if (!draft.region.trim()) {
    errors.push({ field: 'region', messageKey: 'clients.validation.regionRequired' });
  }
  if (!draft.primaryFacilityId || !isEntityId(draft.primaryFacilityId)) {
    errors.push({ field: 'primaryFacilityId', messageKey: 'clients.validation.facilityRequired' });
  }

  if (draft.consentStatus == null || !CONSENT_STATUSES.includes(draft.consentStatus)) {
    errors.push({ field: 'consentStatus', messageKey: 'clients.validation.consentRequired' });
  }

  if (!draft.phoneNotAvailable && draft.phoneNumber.trim()) {
    if (!isValidOptionalPhone(draft.phoneNumber)) {
      errors.push({ field: 'phoneNumber', messageKey: 'clients.validation.phoneInvalid' });
    }
  }

  // Caregiver is optional for every category. When omitted, do not block Continue/save.
  // When included, require name, relationship, and explicit link confirmation.
  if (draft.includeCaregiver) {
    if (!draft.caregiverGivenName.trim() || !draft.caregiverFamilyName.trim()) {
      errors.push({
        field: 'caregiverName',
        messageKey: 'clients.validation.caregiverNameRequired',
      });
    }
    if (
      !draft.relationshipType ||
      !(RELATIONSHIP_TYPES as readonly string[]).includes(draft.relationshipType)
    ) {
      errors.push({
        field: 'relationshipType',
        messageKey: 'clients.validation.relationshipRequired',
      });
    }
    if (!draft.caregiverLinkConfirmed) {
      errors.push({
        field: 'caregiverLinkConfirmed',
        messageKey: 'clients.validation.caregiverConfirmRequired',
      });
    }
    if (draft.caregiverPhone.trim() && !isValidOptionalPhone(draft.caregiverPhone)) {
      errors.push({
        field: 'caregiverPhone',
        messageKey: 'clients.validation.phoneInvalid',
      });
    }
  }

  return errors;
}

export function draftHasSubstantialContent(draft: RegisterClientDraft): boolean {
  return Boolean(
    draft.category ||
      draft.givenName.trim() ||
      draft.familyName.trim() ||
      draft.community.trim() ||
      draft.caregiverGivenName.trim(),
  );
}

/** Editable client fields collected at registration (caregiver / category / facility excluded). */
export type EditClientDraft = {
  readonly givenName: string;
  readonly familyName: string;
  readonly preferredName: string;
  readonly sex: string;
  readonly ageMode: 'dateOfBirth' | 'approximateAge' | 'unknown';
  readonly dateOfBirth: string;
  readonly approximateAge: string;
  readonly approximateAgeUnit: AgeUnit | null;
  readonly pregnancyStatus: string;
  readonly estimatedDeliveryDate: string;
  readonly phoneNumber: string;
  readonly phoneNotAvailable: boolean;
  readonly community: string;
  readonly district: string;
  readonly region: string;
  readonly consentStatus: ConsentStatus | null;
  readonly notes: string;
};

export function validateEditClientDraft(draft: EditClientDraft): FieldError[] {
  const errors: FieldError[] = [];

  if (!draft.givenName.trim()) {
    errors.push({ field: 'givenName', messageKey: 'clients.validation.givenNameRequired' });
  }
  if (!draft.familyName.trim()) {
    errors.push({ field: 'familyName', messageKey: 'clients.validation.familyNameRequired' });
  }
  if (!isClientSex(draft.sex)) {
    errors.push({ field: 'sex', messageKey: 'clients.validation.sexRequired' });
  }

  if (draft.ageMode === 'dateOfBirth') {
    if (!draft.dateOfBirth || !isDateOnly(draft.dateOfBirth)) {
      errors.push({ field: 'dateOfBirth', messageKey: 'clients.validation.dateOfBirthInvalid' });
    }
  } else if (draft.ageMode === 'approximateAge') {
    const age = Number(draft.approximateAge);
    if (!Number.isFinite(age) || age < 0 || !Number.isInteger(age)) {
      errors.push({
        field: 'approximateAge',
        messageKey: 'clients.validation.approximateAgeInvalid',
      });
    }
    if (!isAgeUnit(draft.approximateAgeUnit)) {
      errors.push({
        field: 'approximateAgeUnit',
        messageKey: 'clients.validation.approximateAgeUnitRequired',
      });
    }
  }

  if (draft.estimatedDeliveryDate && !isDateOnly(draft.estimatedDeliveryDate)) {
    errors.push({
      field: 'estimatedDeliveryDate',
      messageKey: 'clients.validation.dateInvalid',
    });
  }

  if (!draft.community.trim()) {
    errors.push({ field: 'community', messageKey: 'clients.validation.communityRequired' });
  }
  if (!draft.region.trim()) {
    errors.push({ field: 'region', messageKey: 'clients.validation.regionRequired' });
  }

  if (draft.consentStatus == null || !CONSENT_STATUSES.includes(draft.consentStatus)) {
    errors.push({ field: 'consentStatus', messageKey: 'clients.validation.consentRequired' });
  }

  if (!draft.phoneNotAvailable && draft.phoneNumber.trim()) {
    if (!isValidOptionalPhone(draft.phoneNumber)) {
      errors.push({ field: 'phoneNumber', messageKey: 'clients.validation.phoneInvalid' });
    }
  }

  return errors;
}
