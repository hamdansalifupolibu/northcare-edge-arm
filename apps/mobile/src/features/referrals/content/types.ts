export type ReferralReasonContentStatus =
  | 'DRAFT'
  | 'APPROVED_FOR_DEVELOPMENT'
  | 'CLINICAL_REVIEW_REQUIRED'
  | 'APPROVED_FOR_PILOT'
  | 'RETIRED';

export type ReferralReasonDefinition = {
  readonly reasonCode: string;
  readonly version: number;
  readonly status: ReferralReasonContentStatus;
  /** Non-clinical development label only when status is APPROVED_FOR_DEVELOPMENT. */
  readonly label: string;
  readonly description: string;
  readonly applicableCategories: readonly (
    | 'pregnant'
    | 'postnatal'
    | 'newborn'
    | 'childUnderFive'
    | 'any'
  )[];
  readonly developmentOnly: boolean;
};
