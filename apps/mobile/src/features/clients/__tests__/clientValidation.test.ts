import {
  createEmptyRegisterDraft,
  draftHasSubstantialContent,
  type EditClientDraft,
  validateEditClientDraft,
  validateRegisterDraft,
} from '../application/validation';

const facilityId = '11111111-1111-4111-8111-111111111111';

function validBaseDraft() {
  return {
    ...createEmptyRegisterDraft(facilityId),
    category: 'pregnant' as const,
    givenName: 'Ama',
    familyName: 'Synthetic',
    sex: 'female',
    community: 'Community',
    region: 'Northern',
    primaryFacilityId: facilityId,
    consentStatus: 'recorded' as const,
    phoneNotAvailable: true,
    includeCaregiver: false,
  };
}

describe('client registration validation', () => {
  it('requires consent explicitly and does not default to recorded', () => {
    const draft = createEmptyRegisterDraft(facilityId);
    expect(draft.consentStatus).toBeNull();
    const errors = validateRegisterDraft({
      ...draft,
      category: 'pregnant',
      givenName: 'Ama',
      familyName: 'Synthetic',
      community: 'Community',
      region: 'Northern',
      primaryFacilityId: facilityId,
      consentStatus: null,
    });
    expect(errors.some((e) => e.field === 'consentStatus')).toBe(true);
  });

  it('detects substantial draft content for abandon warnings', () => {
    expect(draftHasSubstantialContent(createEmptyRegisterDraft())).toBe(false);
    expect(
      draftHasSubstantialContent({
        ...createEmptyRegisterDraft(),
        givenName: 'Ama',
      }),
    ).toBe(true);
  });

  it('allows registration without caregiver when includeCaregiver is off', () => {
    const errors = validateRegisterDraft(validBaseDraft());
    expect(errors.filter((e) => e.field.startsWith('caregiver'))).toHaveLength(0);
    expect(errors.some((e) => e.field === 'relationshipType')).toBe(false);
    expect(errors).toHaveLength(0);
  });

  it('allows newborn and child registration without caregiver contact', () => {
    for (const category of ['newborn', 'childUnderFive'] as const) {
      const errors = validateRegisterDraft({
        ...validBaseDraft(),
        category,
        ageMode: 'approximateAge',
        approximateAge: '3',
        approximateAgeUnit: 'months',
        includeCaregiver: false,
      });
      expect(errors).toHaveLength(0);
    }
  });

  it('requires name, relationship, and confirmation when caregiver is included', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      includeCaregiver: true,
      caregiverGivenName: '',
      caregiverFamilyName: '',
      relationshipType: null,
      caregiverLinkConfirmed: false,
    });
    expect(errors.some((e) => e.field === 'caregiverName')).toBe(true);
    expect(errors.some((e) => e.field === 'relationshipType')).toBe(true);
    expect(errors.some((e) => e.field === 'caregiverLinkConfirmed')).toBe(true);
  });

  it('treats caregiver phone as optional when caregiver is included', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      includeCaregiver: true,
      caregiverGivenName: 'Kofi',
      caregiverFamilyName: 'Synthetic',
      relationshipType: 'mother',
      caregiverLinkConfirmed: true,
      caregiverPhone: '',
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid caregiver phone only when a value is provided', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      includeCaregiver: true,
      caregiverGivenName: 'Kofi',
      caregiverFamilyName: 'Synthetic',
      relationshipType: 'mother',
      caregiverLinkConfirmed: true,
      caregiverPhone: '12',
    });
    expect(errors.some((e) => e.field === 'caregiverPhone')).toBe(true);
  });

  it('requires region on the community and facility step', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      region: '',
    });
    expect(errors.some((e) => e.field === 'region')).toBe(true);
  });

  it('allows location step progression without a client phone number', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      phoneNumber: '',
      phoneNotAvailable: false,
    });
    expect(errors.some((e) => e.field === 'phoneNumber')).toBe(false);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid client phone only when a value is provided', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      phoneNumber: '12',
      phoneNotAvailable: false,
    });
    expect(errors.some((e) => e.field === 'phoneNumber')).toBe(true);
  });

  it('does not require phone when marked not available', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      phoneNumber: '',
      phoneNotAvailable: true,
    });
    expect(errors.some((e) => e.field === 'phoneNumber')).toBe(false);
  });

  it('requires approximate age unit when approximate age mode is selected', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      ageMode: 'approximateAge',
      approximateAge: '3',
      approximateAgeUnit: null,
    });
    expect(errors.some((e) => e.field === 'approximateAgeUnit')).toBe(true);
  });

  it('treats district as optional on the location step', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      district: '',
    });
    expect(errors.some((e) => e.field === 'district')).toBe(false);
    expect(errors).toHaveLength(0);
  });

  it('accepts a draft seeded with a valid session facility EntityId', () => {
    const errors = validateRegisterDraft(validBaseDraft());
    expect(errors.some((e) => e.field === 'primaryFacilityId')).toBe(false);
    expect(errors).toHaveLength(0);
  });

  it('requires facility assignment when primaryFacilityId is missing', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      primaryFacilityId: null,
    });
    expect(errors.some((e) => e.field === 'primaryFacilityId')).toBe(true);
  });

  it('rejects opaque auth facility ids that are not local EntityIds', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      primaryFacilityId: 'fac-dev-001',
    });
    expect(errors.some((e) => e.field === 'primaryFacilityId')).toBe(true);
  });

  it('rejects invalid estimated delivery date when provided', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      estimatedDeliveryDate: 'not-a-date',
    });
    expect(errors.some((e) => e.field === 'estimatedDeliveryDate')).toBe(true);
  });

  it('requires sex on the identity step', () => {
    const errors = validateRegisterDraft({
      ...validBaseDraft(),
      sex: '',
    });
    expect(errors.some((e) => e.field === 'sex')).toBe(true);
  });
});

function validEditDraft(overrides: Partial<EditClientDraft> = {}): EditClientDraft {
  return {
    givenName: 'Ama',
    familyName: 'Synthetic',
    preferredName: '',
    sex: '',
    ageMode: 'dateOfBirth',
    dateOfBirth: '1998-04-12',
    approximateAge: '',
    approximateAgeUnit: null,
    pregnancyStatus: '',
    estimatedDeliveryDate: '',
    phoneNumber: '',
    phoneNotAvailable: true,
    community: 'Community',
    district: '',
    region: 'Northern',
    consentStatus: 'recorded',
    notes: '',
    ...overrides,
  };
}

describe('client edit validation', () => {
  it('accepts a complete edit draft without caregiver or facility fields', () => {
    expect(validateEditClientDraft(validEditDraft())).toHaveLength(0);
  });

  it('requires region and community on edit', () => {
    const errors = validateEditClientDraft(
      validEditDraft({ region: '', community: '' }),
    );
    expect(errors.some((e) => e.field === 'region')).toBe(true);
    expect(errors.some((e) => e.field === 'community')).toBe(true);
  });

  it('requires consent on edit', () => {
    const errors = validateEditClientDraft(validEditDraft({ consentStatus: null }));
    expect(errors.some((e) => e.field === 'consentStatus')).toBe(true);
  });

  it('validates approximate age mode on edit', () => {
    const errors = validateEditClientDraft(
      validEditDraft({
        ageMode: 'approximateAge',
        approximateAge: '3',
        approximateAgeUnit: null,
      }),
    );
    expect(errors.some((e) => e.field === 'approximateAgeUnit')).toBe(true);
  });

  it('rejects invalid optional phone on edit', () => {
    const errors = validateEditClientDraft(
      validEditDraft({ phoneNotAvailable: false, phoneNumber: '12' }),
    );
    expect(errors.some((e) => e.field === 'phoneNumber')).toBe(true);
  });
});
