export type NutritionErrorCode =
  | 'assessmentUnavailable'
  | 'templateUnavailable'
  | 'templateInapplicable'
  | 'moreInformationRequired'
  | 'draftRequired'
  | 'confirmationRequired'
  | 'referencePackUnavailable'
  | 'guidancePackUnavailable'
  | 'invalidMeasurement'
  | 'wrongClient'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'forbidden';

export class NutritionError extends Error {
  readonly code: NutritionErrorCode;

  constructor(code: NutritionErrorCode, message: string) {
    super(message);
    this.name = 'NutritionError';
    this.code = code;
  }
}
