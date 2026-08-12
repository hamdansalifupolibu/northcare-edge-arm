import type { DerivedAge } from '../domain/input';

const AGE_DERIVATION_VERSION = 1 as const;

/**
 * Derive age in whole years from a date-only YYYY-MM-DD string relative to a
 * fixed reference date (evaluation-time recorded outside rule matching).
 * Avoids timezone shifting by parsing as UTC midnight components.
 */
export function deriveExactAgeYears(
  dateOfBirth: string,
  referenceDateOnly: string,
): DerivedAge | null {
  const dob = parseDateOnly(dateOfBirth);
  const ref = parseDateOnly(referenceDateOnly);
  if (!dob || !ref) {
    return null;
  }
  let years = ref.year - dob.year;
  if (ref.month < dob.month || (ref.month === dob.month && ref.day < dob.day)) {
    years -= 1;
  }
  if (years < 0) {
    return null;
  }
  return {
    years,
    precision: 'exact',
    provenance: {
      kind: 'derivedAge',
      derivationType: 'dateOfBirthWholeYears',
      sourceFields: ['dateOfBirth', 'referenceDateOnly'],
      derivationVersion: AGE_DERIVATION_VERSION,
    },
  };
}

export function deriveApproximateAgeYears(approximateAgeYears: number): DerivedAge | null {
  if (!Number.isFinite(approximateAgeYears) || approximateAgeYears < 0) {
    return null;
  }
  return {
    years: Math.floor(approximateAgeYears),
    precision: 'approximate',
    provenance: {
      kind: 'derivedAge',
      derivationType: 'approximateAgeYears',
      sourceFields: ['approximateAgeYears'],
      derivationVersion: AGE_DERIVATION_VERSION,
    },
  };
}

function parseDateOnly(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { year, month, day };
}
