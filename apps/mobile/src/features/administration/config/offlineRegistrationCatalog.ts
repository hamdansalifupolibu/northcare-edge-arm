import type { AdminFacility, ProfessionRegistryItem } from '../domain/types';

/** Bundled reference data for fully offline admin registration (synthetic demo). */
export const OFFLINE_ADMIN_FACILITIES: readonly AdminFacility[] = [
  {
    facilityId: 'fac-dev-001',
    name: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    district: 'Tamale Metro',
    region: 'Northern Region',
    isActive: true,
  },
  {
    facilityId: 'fac-dev-002',
    name: 'Tamale Central Hospital',
    facilityType: 'Hospital',
    district: 'Tamale Metro',
    region: 'Northern Region',
    isActive: true,
  },
  {
    facilityId: 'fac-dev-003',
    name: 'Savelugu Health Centre',
    facilityType: 'Health Centre',
    district: 'Savelugu',
    region: 'Northern Region',
    isActive: true,
  },
];

export const OFFLINE_ADMIN_PROFESSIONS: readonly ProfessionRegistryItem[] = [
  {
    value: 'communityHealthNurse',
    label: 'Community health nurse',
    active: true,
    allowsOtherDescription: false,
    displayOrder: 1,
  },
  {
    value: 'communityHealthOfficer',
    label: 'Community health officer',
    active: true,
    allowsOtherDescription: false,
    displayOrder: 2,
  },
  {
    value: 'nutritionOfficer',
    label: 'Nutrition officer',
    active: true,
    allowsOtherDescription: false,
    displayOrder: 3,
  },
  {
    value: 'midwife',
    label: 'Midwife',
    active: true,
    allowsOtherDescription: false,
    displayOrder: 4,
  },
  {
    value: 'otherApprovedHealthProfessional',
    label: 'Other approved health profession',
    active: true,
    allowsOtherDescription: true,
    displayOrder: 99,
  },
];

export const OFFLINE_DEMO_ORGANISATION_ID = 'org-dev-001';
