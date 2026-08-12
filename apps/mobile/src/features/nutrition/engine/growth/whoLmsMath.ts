import type { WhoLmsRow } from './whoLmsTypes';

/**
 * WHO Child Growth Standards z-score from LMS parameters.
 * Source formula: @who-growth/core (MIT) — aligned with WHO Anthro.
 */
export function computeWhoZScore(measurement: number, lms: WhoLmsRow): number {
  const { L, M, S } = lms;
  if (measurement <= 0 || M <= 0 || S <= 0) {
    return NaN;
  }

  let z: number;
  if (Math.abs(L) < 1e-10) {
    z = Math.log(measurement / M) / S;
  } else {
    z = (Math.pow(measurement / M, L) - 1) / (L * S);
  }

  if (Math.abs(z) > 3) {
    const sd3pos = M * Math.pow(1 + L * S * 3, 1 / L);
    const sd2pos = M * Math.pow(1 + L * S * 2, 1 / L);
    const sd3neg = M * Math.pow(1 + L * S * -3, 1 / L);
    const sd2neg = M * Math.pow(1 + L * S * -2, 1 / L);
    const sd23pos = sd3pos - sd2pos;
    const sd23neg = sd2neg - sd3neg;
    if (z > 3) {
      z = 3 + (measurement - sd3pos) / sd23pos;
    } else {
      z = -3 + (measurement - sd3neg) / sd23neg;
    }
  }

  return Math.round(z * 100) / 100;
}

function interpolateLms(lower: WhoLmsRow, upper: WhoLmsRow, fraction: number): WhoLmsRow {
  return {
    age: lower.age + (upper.age - lower.age) * fraction,
    L: lower.L + (upper.L - lower.L) * fraction,
    M: lower.M + (upper.M - lower.M) * fraction,
    S: lower.S + (upper.S - lower.S) * fraction,
  };
}

/** Binary search + linear interpolation between LMS table rows. */
export function lookupWhoLms(table: readonly WhoLmsRow[], index: number): WhoLmsRow | null {
  if (table.length === 0) {
    return null;
  }
  const first = table[0];
  const last = table[table.length - 1];
  if (index < first.age || index > last.age) {
    return null;
  }
  if (index === first.age) {
    return first;
  }
  if (index === last.age) {
    return last;
  }

  let lo = 0;
  let hi = table.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (table[mid].age === index) {
      return table[mid];
    }
    if (table[mid].age < index) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const lower = table[hi];
  const upper = table[lo];
  if (lower.age === upper.age) {
    return lower;
  }
  const fraction = (index - lower.age) / (upper.age - lower.age);
  return interpolateLms(lower, upper, fraction);
}
