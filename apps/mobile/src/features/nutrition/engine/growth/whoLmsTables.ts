import bfaBoys05 from '../../content/growth/who/bfa-boys-0-5.json';
import bfaGirls05 from '../../content/growth/who/bfa-girls-0-5.json';
import lhfaBoys05 from '../../content/growth/who/lhfa-boys-0-5.json';
import lhfaGirls05 from '../../content/growth/who/lhfa-girls-0-5.json';
import wfaBoys05 from '../../content/growth/who/wfa-boys-0-5.json';
import wfaGirls05 from '../../content/growth/who/wfa-girls-0-5.json';
import wflBoys from '../../content/growth/who/wfl-boys.json';
import wflGirls from '../../content/growth/who/wfl-girls.json';
import wfhBoys from '../../content/growth/who/wfh-boys.json';
import wfhGirls from '../../content/growth/who/wfh-girls.json';
import type { WhoAgeIndicator, WhoGrowthSex, WhoLmsRow, WhoLmsTableKey } from './whoLmsTypes';

/** WHO Child Growth Standards 0–5 years — bundled for offline use. */
export const WHO_GROWTH_DATA_SOURCE =
  'WHO Child Growth Standards (2006) — LMS tables bundled offline';

const TABLES: Record<WhoLmsTableKey, readonly WhoLmsRow[]> = {
  'wfa-boys-0-5': wfaBoys05 as WhoLmsRow[],
  'wfa-girls-0-5': wfaGirls05 as WhoLmsRow[],
  'lhfa-boys-0-5': lhfaBoys05 as WhoLmsRow[],
  'lhfa-girls-0-5': lhfaGirls05 as WhoLmsRow[],
  'bfa-boys-0-5': bfaBoys05 as WhoLmsRow[],
  'bfa-girls-0-5': bfaGirls05 as WhoLmsRow[],
  'wfl-boys': wflBoys as WhoLmsRow[],
  'wfl-girls': wflGirls as WhoLmsRow[],
  'wfh-boys': wfhBoys as WhoLmsRow[],
  'wfh-girls': wfhGirls as WhoLmsRow[],
};

/** Max age in WHO 0–5 day-indexed tables (≈61 months). */
export const WHO_0_5_MAX_AGE_DAYS = 1856;

/** Below 24 months → recumbent length (weight-for-length); at/above → standing height. */
export const RECUMBENT_LENGTH_MAX_AGE_DAYS = 730;

function sexKey(sex: WhoGrowthSex): 'boys' | 'girls' {
  return sex === 'male' ? 'boys' : 'girls';
}

export function resolveWhoTable(input: {
  readonly indicator: WhoAgeIndicator;
  readonly sex: WhoGrowthSex;
  readonly ageInDays: number;
  readonly lengthHeightCm: number;
}): { readonly table: readonly WhoLmsRow[]; readonly index: number } | null {
  const key = sexKey(input.sex);

  switch (input.indicator) {
    case 'weight-for-age':
      if (input.ageInDays > WHO_0_5_MAX_AGE_DAYS) {
        return null;
      }
      return {
        table: TABLES[`wfa-${key}-0-5` as WhoLmsTableKey],
        index: input.ageInDays,
      };
    case 'length-height-for-age':
      if (input.ageInDays > WHO_0_5_MAX_AGE_DAYS) {
        return null;
      }
      return {
        table: TABLES[`lhfa-${key}-0-5` as WhoLmsTableKey],
        index: input.ageInDays,
      };
    case 'bmi-for-age':
      if (input.ageInDays > WHO_0_5_MAX_AGE_DAYS) {
        return null;
      }
      return {
        table: TABLES[`bfa-${key}-0-5` as WhoLmsTableKey],
        index: input.ageInDays,
      };
    case 'weight-for-length':
      return {
        table: TABLES[`wfl-${key}` as WhoLmsTableKey],
        index: input.lengthHeightCm,
      };
    case 'weight-for-height':
      return {
        table: TABLES[`wfh-${key}` as WhoLmsTableKey],
        index: input.lengthHeightCm,
      };
    default: {
      const _exhaustive: never = input.indicator;
      return _exhaustive;
    }
  }
}
