import type { NutritionReferencePackDefinition } from '../../domain/types';

/**
 * WHO/UNICEF MUAC + Oedema classification for community screening.
 * Children 6–59 months.
 *
 * Classification priority (evaluated in order — first match wins):
 * 1. Bilateral oedema present → SAM (regardless of MUAC)
 * 2. MUAC < 11.5 cm → SAM (Severe Acute Malnutrition)
 * 3. MUAC 11.5 – 12.4 cm → MAM (Moderate Acute Malnutrition)
 * 4. MUAC ≥ 12.5 cm → Normal nutritional status
 *
 * Source: WHO Community-based Management of Acute Malnutrition (CMAM)
 */
export const SYNTHETIC_DEV_NUTRITION_REFERENCE_PACK: NutritionReferencePackDefinition = {
  referencePackId: 'synthetic-dev-nutrition-reference-v1',
  title: 'WHO MUAC + Oedema Classification (Community Screening)',
  version: 1,
  status: 'APPROVED_FOR_DEVELOPMENT',
  engineCompatibilityVersion: 1,
  developmentBanner:
    'Based on WHO/UNICEF MUAC thresholds. Development use — final wording requires GHS review.',
  applicableAssessmentTemplateIds: ['synthetic-dev-child-nutrition-v1'],
  applicableClientCategories: ['childUnderFive', 'newborn', 'pregnant', 'postnatal'],
  ageApplicability: {
    minAgeDays: 0,
    maxAgeDays: 1825,
    allowApproximateAge: true,
    requireExactAge: false,
  },
  requiredMeasurements: ['muac'],
  supportedUnits: ['cm', 'mm', 'kg', 'g'],
  allowApproximateAge: true,
  clinicalSourceRef: 'WHO Community-based Management of Acute Malnutrition (CMAM)',
  knownLimitations: [
    'Acute classification uses MUAC + oedema (community CMAM).',
    'Growth z-scores (WFA, L/HFA, WFL/H, BMI) calculated separately when height and sex available.',
    'MUAC thresholds apply to children 6–59 months only.',
    'Does not replace full clinical assessment at facility level.',
  ],
  rules: [
    {
      ruleId: 'sam-oedema',
      order: 1,
      condition: {
        op: 'answerEquals',
        questionId: 'bilateral_oedema',
        value: true,
      },
      interpretationCode: 'sam',
      explanationId: 'sam-oedema-explanation',
      derivedValueExpression: 'none',
    },
    {
      ruleId: 'sam-muac',
      order: 2,
      condition: {
        op: 'measurementLessThan',
        measurementType: 'muac',
        threshold: 11.5,
      },
      interpretationCode: 'sam',
      explanationId: 'sam-muac-explanation',
      derivedValueExpression: 'measurementNumeric',
      measurementType: 'muac',
      targetUnit: 'cm',
    },
    {
      ruleId: 'mam-muac',
      order: 3,
      condition: {
        op: 'measurementBetween',
        measurementType: 'muac',
        min: 11.5,
        max: 12.5,
      },
      interpretationCode: 'mam',
      explanationId: 'mam-muac-explanation',
      derivedValueExpression: 'measurementNumeric',
      measurementType: 'muac',
      targetUnit: 'cm',
    },
    {
      ruleId: 'normal-muac',
      order: 4,
      condition: {
        op: 'measurementGreaterThanOrEqual',
        measurementType: 'muac',
        threshold: 12.5,
      },
      interpretationCode: 'nutritionNormal',
      explanationId: 'normal-explanation',
      derivedValueExpression: 'measurementNumeric',
      measurementType: 'muac',
      targetUnit: 'cm',
    },
  ],
};
