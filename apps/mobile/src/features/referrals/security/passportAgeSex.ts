import type { AgeUnit } from '../../../data/domain/enums/ageUnit';

/** Compact sex code for optional public passport enrichment — not a full identity field. */
export type PassportSexCode = 'F' | 'M' | 'U';

/**
 * Approximate age band for optional public enrichment.
 * Never embeds DOB. `50p` = 50+ (URI-safe, no `+`).
 */
export type PassportAgeBand =
  | '0-28d'
  | '1-11m'
  | '1-4y'
  | '5-14y'
  | '15-49y'
  | '50p'
  | 'U';

const DAYS_PER_YEAR = 365.25;

export function derivePassportSex(raw: string | null | undefined): PassportSexCode {
  const value = raw?.trim().toLowerCase() ?? '';
  if (!value) return 'U';
  if (
    value === 'f' ||
    value === 'female' ||
    value === 'woman' ||
    value === 'girl'
  ) {
    return 'F';
  }
  if (value === 'm' || value === 'male' || value === 'man' || value === 'boy') {
    return 'M';
  }
  return 'U';
}

function bandFromYears(years: number): PassportAgeBand {
  if (years < 1) return '1-11m';
  if (years < 5) return '1-4y';
  if (years < 15) return '5-14y';
  if (years < 50) return '15-49y';
  return '50p';
}

export function derivePassportAgeBand(input: {
  readonly dateOfBirth?: string | null;
  readonly approximateAge?: number | null;
  readonly approximateAgeUnit?: AgeUnit | null;
  readonly nowMs?: number;
}): PassportAgeBand {
  const dob = input.dateOfBirth?.trim();
  const nowMs = input.nowMs ?? Date.now();
  if (dob) {
    const born = Date.parse(dob);
    if (Number.isFinite(born)) {
      const ageDays = (nowMs - born) / (24 * 60 * 60 * 1000);
      if (ageDays < 0) return 'U';
      if (ageDays <= 28) return '0-28d';
      if (ageDays < DAYS_PER_YEAR) return '1-11m';
      return bandFromYears(ageDays / DAYS_PER_YEAR);
    }
  }

  const approx = input.approximateAge;
  const unit = input.approximateAgeUnit;
  if (typeof approx !== 'number' || !Number.isFinite(approx) || approx < 0 || !unit) {
    return 'U';
  }
  if (unit === 'days') {
    if (approx <= 28) return '0-28d';
    if (approx < DAYS_PER_YEAR) return '1-11m';
    return bandFromYears(approx / DAYS_PER_YEAR);
  }
  if (unit === 'weeks') {
    const days = approx * 7;
    if (days <= 28) return '0-28d';
    if (days < DAYS_PER_YEAR) return '1-11m';
    return bandFromYears(days / DAYS_PER_YEAR);
  }
  if (unit === 'months') {
    if (approx < 1) return '0-28d';
    if (approx < 12) return '1-11m';
    return bandFromYears(approx / 12);
  }
  if (unit === 'years') {
    if (approx < 1) return '1-11m';
    return bandFromYears(approx);
  }
  return 'U';
}
