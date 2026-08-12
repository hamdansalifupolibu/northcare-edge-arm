/** Synthetic Northern Ghana location options for registration — not GPS. */
export const NORTHERN_GHANA_REGIONS = [
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
] as const;

export type NorthernGhanaRegion = (typeof NORTHERN_GHANA_REGIONS)[number];
