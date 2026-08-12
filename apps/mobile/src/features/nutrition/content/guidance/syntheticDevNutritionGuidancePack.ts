import type { NutritionGuidancePackDefinition } from '../../domain/types';

/**
 * Nutrition guidance cards based on WHO/UNICEF CMAM community screening actions.
 * Provides actionable advice for SAM, MAM, and Normal classifications.
 */
export const SYNTHETIC_DEV_NUTRITION_GUIDANCE_PACK: NutritionGuidancePackDefinition = {
  guidancePackId: 'synthetic-dev-nutrition-guidance-v1',
  title: 'WHO MUAC Screening — Community Action Guidance',
  version: 1,
  status: 'APPROVED_FOR_DEVELOPMENT',
  developmentBanner:
    'Based on WHO/UNICEF CMAM community actions. Development use — requires GHS review.',
  applicableAssessmentTemplateIds: ['synthetic-dev-child-nutrition-v1'],
  applicableReferencePackIds: ['synthetic-dev-nutrition-reference-v1'],
  applicableClientCategories: ['childUnderFive', 'newborn', 'pregnant', 'postnatal'],
  applicableInterpretationCodes: ['sam', 'mam', 'nutritionNormal'],
  clinicalSourceRef: 'WHO CMAM Guidelines; Ghana IYCF Counselling Card',
  effectiveDate: '2026-08-06',
  retiredDate: null,
  knownLimitations: [
    'Guidance wording is for development — requires GHS clinical review.',
    'Does not include therapeutic feeding protocols (facility-level).',
    'Dagbanli translation not yet available.',
  ],
  cards: [
    {
      guidanceId: 'sam-urgent-referral',
      heading: 'URGENT: Severe Acute Malnutrition Detected',
      body: 'This child has signs of severe acute malnutrition (SAM). Immediate referral to the nearest health facility is required. SAM is life-threatening without treatment. Do not delay referral.',
      priorityOrder: 1,
      applicableConditions: {
        op: 'interpretationCode',
        code: 'sam',
      },
      workerActionText: 'Refer the child immediately to the nearest health facility for therapeutic care. Arrange transport if needed. Follow up within 24 hours to confirm referral was completed.',
      caregiverFacingText: 'Your child needs urgent medical care at the health facility. Please go today — the health workers there can help your child recover. Continue breastfeeding on the way.',
      sourceReferences: ['WHO CMAM Guidelines', 'GHS IMNCI Protocol'],
      reviewStatus: 'APPROVED_FOR_DEVELOPMENT',
      translationStatus: 'enOnly',
    },
    {
      guidanceId: 'sam-continue-breastfeeding',
      heading: 'Continue Breastfeeding',
      body: 'If the child is still breastfeeding, continue breastfeeding frequently while seeking facility care. Breastmilk provides essential nutrition and hydration.',
      priorityOrder: 2,
      applicableConditions: {
        op: 'interpretationCode',
        code: 'sam',
      },
      workerActionText: 'Counsel the caregiver to continue breastfeeding frequently. Encourage small, frequent feeds if the child is weak.',
      caregiverFacingText: 'Keep breastfeeding your child as often as possible. This gives them important nutrition while you go to the health facility.',
      sourceReferences: ['WHO IYCF Guidelines'],
      reviewStatus: 'APPROVED_FOR_DEVELOPMENT',
      translationStatus: 'enOnly',
    },
    {
      guidanceId: 'mam-supplementary-feeding',
      heading: 'Moderate Acute Malnutrition — Supplementary Feeding',
      body: 'This child has moderate acute malnutrition (MAM). Enrol in a supplementary feeding programme if available. Increase feeding frequency and provide energy-dense foods.',
      priorityOrder: 1,
      applicableConditions: {
        op: 'interpretationCode',
        code: 'mam',
      },
      workerActionText: 'Enrol the child in a supplementary feeding programme if available. Counsel the caregiver on increased meal frequency (4-5 times daily) and adding oil, groundnut paste, or animal-source foods to meals. Schedule follow-up MUAC measurement in 2 weeks.',
      caregiverFacingText: 'Your child needs extra nutrition. Feed them more often — at least 4 times a day. Add oil, groundnut paste, eggs, or fish to their food to help them grow stronger.',
      sourceReferences: ['WHO CMAM Guidelines', 'Ghana IYCF Counselling Card'],
      reviewStatus: 'APPROVED_FOR_DEVELOPMENT',
      translationStatus: 'enOnly',
    },
    {
      guidanceId: 'mam-follow-up',
      heading: 'Follow Up in 2 Weeks',
      body: 'Re-measure MUAC in 14 days to track progress. If MUAC decreases or oedema develops, refer immediately.',
      priorityOrder: 2,
      applicableConditions: {
        op: 'interpretationCode',
        code: 'mam',
      },
      workerActionText: 'Schedule a follow-up visit in 2 weeks. Repeat MUAC measurement. If MUAC has decreased below 11.5cm or bilateral oedema is present, refer immediately.',
      caregiverFacingText: 'I will visit again in 2 weeks to check your child. If your child becomes more tired, swollen, or refuses to eat before then, please come to the health facility immediately.',
      sourceReferences: ['WHO CMAM Guidelines'],
      reviewStatus: 'APPROVED_FOR_DEVELOPMENT',
      translationStatus: 'enOnly',
    },
    {
      guidanceId: 'normal-growth-monitoring',
      heading: 'Normal Nutritional Status — Continue Growth Monitoring',
      body: 'This child\'s MUAC indicates normal nutritional status. Continue regular growth monitoring and age-appropriate feeding.',
      priorityOrder: 1,
      applicableConditions: {
        op: 'interpretationCode',
        code: 'nutritionNormal',
      },
      workerActionText: 'Congratulate the caregiver. Reinforce continued breastfeeding (if applicable) and adequate complementary feeding. Schedule routine growth monitoring monthly.',
      caregiverFacingText: 'Your child is growing well! Keep feeding them a variety of foods and continue breastfeeding. Come back next month for a routine check.',
      sourceReferences: ['Ghana IYCF Counselling Card', 'WHO Growth Monitoring Guidelines'],
      reviewStatus: 'APPROVED_FOR_DEVELOPMENT',
      translationStatus: 'enOnly',
    },
    {
      guidanceId: 'normal-feeding-advice',
      heading: 'Age-Appropriate Feeding',
      body: 'Exclusive breastfeeding until 6 months. From 6 months, introduce complementary foods alongside breastfeeding. By 12 months, the child should eat family foods 3-5 times daily.',
      priorityOrder: 2,
      applicableConditions: {
        op: 'interpretationCode',
        code: 'nutritionNormal',
      },
      workerActionText: 'Review feeding frequency for child\'s age. Under 6 months: exclusive breastfeeding. 6-8 months: 2-3 meals + breastmilk. 9-23 months: 3-4 meals + snacks + breastmilk.',
      caregiverFacingText: 'Feed your child according to their age: babies under 6 months need only breastmilk. After 6 months, start soft foods alongside breastmilk, and increase portions as they grow.',
      sourceReferences: ['WHO IYCF Guidelines', 'Ghana IYCF Counselling Card'],
      reviewStatus: 'APPROVED_FOR_DEVELOPMENT',
      translationStatus: 'enOnly',
    },
  ],
};
