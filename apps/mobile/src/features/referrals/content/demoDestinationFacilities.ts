/**
 * Recognisable Ghana destination facilities for referral demo directory.
 * Seeded locally when missing — not free-text hospital entry.
 */
export type DemoDestinationFacilitySeed = {
  readonly externalCode: string;
  readonly name: string;
  readonly facilityType: string;
  readonly district: string;
  readonly region: string;
};

export const DEMO_DESTINATION_FACILITIES: readonly DemoDestinationFacilitySeed[] = [
  {
    externalCode: 'GH-TTH',
    name: 'Tamale Teaching Hospital',
    facilityType: 'TeachingHospital',
    district: 'Tamale Metro',
    region: 'Northern',
  },
  {
    externalCode: 'GH-TMH',
    name: 'Tamale Central Hospital',
    facilityType: 'MunicipalHospital',
    district: 'Tamale Metro',
    region: 'Northern',
  },
  {
    externalCode: 'GH-KBTH',
    name: 'Korle Bu Teaching Hospital',
    facilityType: 'TeachingHospital',
    district: 'Accra Metro',
    region: 'Greater Accra',
  },
  {
    externalCode: 'GH-RH-TAMALE',
    name: 'Regional Hospital, Tamale',
    facilityType: 'RegionalHospital',
    district: 'Tamale Metro',
    region: 'Northern',
  },
  {
    externalCode: 'GH-CHPS-SAGNARIGU',
    name: 'Sagnarigu CHPS Compound',
    facilityType: 'CHPS',
    district: 'Sagnarigu',
    region: 'Northern',
  },
  {
    externalCode: 'GH-CHPS-TAMALE-NORTH',
    name: 'Tamale North CHPS Compound',
    facilityType: 'CHPS',
    district: 'Tamale Metro',
    region: 'Northern',
  },
  {
    externalCode: 'GH-CHPS-YENDI',
    name: 'Yendi CHPS Compound',
    facilityType: 'CHPS',
    district: 'Yendi Municipal',
    region: 'Northern',
  },
] as const;
