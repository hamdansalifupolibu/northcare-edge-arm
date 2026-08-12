/** WHO LMS row — age field is days (0–5y) or cm (weight-for-length/height). */
export type WhoLmsRow = {
  readonly age: number;
  readonly L: number;
  readonly M: number;
  readonly S: number;
};

export type WhoGrowthSex = 'male' | 'female';

export type WhoAgeIndicator =
  | 'weight-for-age'
  | 'length-height-for-age'
  | 'bmi-for-age'
  | 'weight-for-length'
  | 'weight-for-height';

export type WhoLmsTableKey =
  | 'wfa-boys-0-5'
  | 'wfa-girls-0-5'
  | 'lhfa-boys-0-5'
  | 'lhfa-girls-0-5'
  | 'bfa-boys-0-5'
  | 'bfa-girls-0-5'
  | 'wfl-boys'
  | 'wfl-girls'
  | 'wfh-boys'
  | 'wfh-girls';
