import type { NutritionAssessmentTemplateDefinition } from '../../domain/types';

/**
 * Child Nutrition Assessment template based on WHO/UNICEF community MUAC screening.
 * For children aged 6–59 months.
 * Clinical source: WHO Guidelines on acute malnutrition community screening.
 */
export const SYNTHETIC_DEV_CHILD_NUTRITION_TEMPLATE: NutritionAssessmentTemplateDefinition = {
  templateId: 'synthetic-dev-child-nutrition-v1',
  version: 1,
  status: 'APPROVED_FOR_DEVELOPMENT',
  assessmentType: 'childNutrition',
  title: 'Child Nutrition Assessment (6–59 months)',
  developmentBanner:
    'Based on WHO/UNICEF community MUAC screening guidelines. For development use.',
  clinicalSourceRef: 'WHO Community-based Management of Acute Malnutrition (CMAM)',
  applicableClientCategories: ['childUnderFive', 'newborn', 'pregnant', 'postnatal'],
  ageApplicability: {
    minAgeDays: 0,
    maxAgeDays: 1825,
    allowApproximateAge: true,
    requireExactAge: false,
  },
  requiredMeasurementTypes: ['weight', 'muac'],
  optionalMeasurementTypes: ['height'],
  referencePackIds: ['synthetic-dev-nutrition-reference-v1'],
  guidancePackIds: ['synthetic-dev-nutrition-guidance-v1'],
  knownLimitations: [
    'MUAC-based acute classification — community screening slice.',
    'Growth z-scores use bundled WHO 0–5 year tables (development — GHS review required).',
    'IYCF MDD/MMF indicators follow WHO 6–23 month guidance (development — GHS review required).',
    'Guidance text is for development; final wording requires GHS review.',
  ],
  sections: [
    {
      id: 'section-child-info',
      title: 'Child Information',
      description: 'Basic demographic information about the child.',
      questions: [
        {
          id: 'child_age_months',
          label: 'Age of child (months)',
          helpText: 'Enter the child\'s age in completed months (0–59). Required for feeding assessment branching.',
          answerType: 'integer',
          required: true,
          allowUnknown: false,
        },
        {
          id: 'child_sex',
          label: 'Sex of child',
          answerType: 'singleChoice',
          required: true,
          options: [
            { id: 'male', label: 'Male' },
            { id: 'female', label: 'Female' },
          ],
        },
      ],
    },
    {
      id: 'section-measurements',
      title: 'Anthropometric Measurements',
      description: 'Take and record the child\'s body measurements.',
      questions: [
        {
          id: 'weight_kg',
          label: 'Weight',
          helpText: 'Weigh the child using a calibrated scale. Remove heavy clothing.',
          answerType: 'measurement',
          required: true,
          allowNotAssessed: false,
          measurementType: 'weight',
          measurementUnit: 'kg',
        },
        {
          id: 'muac_cm',
          label: 'MUAC — Mid-Upper Arm Circumference',
          helpText: 'Measure the left arm at the midpoint between shoulder and elbow. Use a MUAC tape. Record in centimetres.',
          answerType: 'measurement',
          required: true,
          allowNotAssessed: false,
          measurementType: 'muac',
          measurementUnit: 'cm',
        },
        {
          id: 'height_cm',
          label: 'Length or height',
          helpText:
            'Children under 24 months: measure recumbent length (lying down). Children 24 months and older: measure standing height.',
          answerType: 'measurement',
          required: false,
          allowNotAssessed: true,
          measurementType: 'height',
          measurementUnit: 'cm',
        },
      ],
    },
    {
      id: 'section-clinical-signs',
      title: 'Clinical Signs',
      description: 'Check for clinical signs of malnutrition.',
      questions: [
        {
          id: 'bilateral_oedema',
          label: 'Bilateral pitting oedema present?',
          helpText: 'Press both feet firmly for 3 seconds. If a pit remains on BOTH feet, oedema is present. This indicates severe acute malnutrition regardless of other measurements.',
          answerType: 'yesNo',
          required: true,
          allowUnknown: true,
        },
        {
          id: 'visible_wasting',
          label: 'Visible severe wasting?',
          helpText: 'Look for visible ribs, wasted buttocks, and loose skin on thighs/arms.',
          answerType: 'yesNo',
          required: false,
          allowUnknown: true,
        },
      ],
    },
    {
      id: 'section-ebf',
      title: 'Infant Feeding (under 6 months)',
      description: 'Exclusive breastfeeding assessment for infants under 6 months.',
      questions: [
        {
          id: 'exclusive_breastfeeding',
          label: 'Is the infant receiving only breastmilk (no other liquids or foods)?',
          helpText: 'WHO recommends exclusive breastfeeding for the first 6 months of life.',
          answerType: 'yesNo',
          required: true,
          allowUnknown: true,
          visibleWhen: {
            op: 'numberLessThan',
            questionId: 'child_age_months',
            value: 6,
          },
        },
      ],
    },
    {
      id: 'section-feeding',
      title: 'Feeding Assessment',
      description: 'Assess breastfeeding and complementary feeding practices.',
      questions: [
        {
          id: 'currently_breastfeeding',
          label: 'Is the child currently breastfeeding?',
          answerType: 'yesNo',
          required: false,
          allowUnknown: true,
        },
        {
          id: 'complementary_feeding',
          label: 'Has age-appropriate complementary feeding started?',
          helpText: 'Complementary foods should start at 6 months alongside continued breastfeeding.',
          answerType: 'singleChoice',
          required: false,
          options: [
            { id: 'yes', label: 'Yes — receiving complementary foods' },
            { id: 'no', label: 'No — not yet started' },
            { id: 'not_applicable', label: 'Not applicable (under 6 months)' },
          ],
          visibleWhen: {
            op: 'numberGreaterThanOrEqual',
            questionId: 'child_age_months',
            value: 6,
          },
        },
        {
          id: 'meals_per_day',
          label: 'How many meals or semi-solid feeds does the child receive per day?',
          helpText:
            'Count main meals and semi-solid feeds. Snacks are counted separately in full IYCF tools — here we use meal frequency for MMF screening.',
          answerType: 'singleChoice',
          required: true,
          options: [
            { id: '1', label: '1 meal / feed' },
            { id: '2', label: '2 meals / feeds' },
            { id: '3', label: '3 meals / feeds' },
            { id: '4_plus', label: '4 or more meals / feeds' },
          ],
          visibleWhen: {
            op: 'numberGreaterThanOrEqual',
            questionId: 'child_age_months',
            value: 6,
          },
        },
      ],
    },
    {
      id: 'section-mdd',
      title: 'Dietary Diversity (yesterday)',
      description:
        'Minimum Dietary Diversity (MDD): tick every food group the child ate from yesterday. WHO standard: ≥5 of 8 groups for children 6–23 months.',
      questions: [
        {
          id: 'mdd_food_groups_yesterday',
          label: 'Which food groups did the child eat from yesterday?',
          helpText:
            'Examples for Northern Ghana: tuo zaafi / rice / yam (grains); groundnut / beans (legumes); milk / waakye stew (dairy); fish / chicken (flesh foods); eggs; orange-fleshed sweet potato / mango (vitamin A rich); other vegetables or fruits; breastmilk if still breastfeeding.',
          answerType: 'multipleChoice',
          required: true,
          options: [
            { id: 'grains_roots_tubers', label: 'Grains, roots, or tubers (e.g. rice, maize, yam)' },
            { id: 'legumes_nuts', label: 'Legumes or nuts (e.g. beans, groundnut)' },
            { id: 'dairy', label: 'Dairy products (e.g. milk, yoghurt)' },
            { id: 'flesh_foods', label: 'Flesh foods (meat, fish, poultry, organ meat)' },
            { id: 'eggs', label: 'Eggs' },
            {
              id: 'vitamin_a_fruits_vegetables',
              label: 'Vitamin A rich fruits or vegetables (e.g. mango, orange-fleshed sweet potato)',
            },
            { id: 'other_fruits_vegetables', label: 'Other fruits or vegetables' },
            { id: 'breastmilk', label: 'Breastmilk (if still breastfeeding)' },
          ],
          visibleWhen: {
            op: 'all',
            conditions: [
              {
                op: 'numberGreaterThanOrEqual',
                questionId: 'child_age_months',
                value: 6,
              },
              {
                op: 'numberLessThan',
                questionId: 'child_age_months',
                value: 60,
              },
            ],
          },
        },
        {
          id: 'same_food_all_meals_yesterday',
          label: 'Was it mostly the same food at every meal yesterday?',
          helpText:
            'Counseling flag only — eating the same food at every meal is not the same as dietary diversity.',
          answerType: 'yesNo',
          required: false,
          allowUnknown: true,
          visibleWhen: {
            op: 'numberGreaterThanOrEqual',
            questionId: 'child_age_months',
            value: 6,
          },
        },
      ],
    },
    {
      id: 'section-feeding-concerns',
      title: 'Feeding Concerns',
      description: 'Structured checklist for feeding difficulties reported by the caregiver.',
      questions: [
        {
          id: 'feeding_difficulties',
          label: 'Any feeding difficulties or concerns?',
          answerType: 'yesNo',
          required: false,
          allowUnknown: true,
        },
        {
          id: 'feeding_difficulty_types',
          label: 'Which feeding concerns apply?',
          answerType: 'multipleChoice',
          required: false,
          options: [
            { id: 'poor_appetite', label: 'Poor appetite / refuses food' },
            { id: 'vomiting_feeds', label: 'Vomiting after feeds' },
            { id: 'coughing_choking', label: 'Coughing or choking when feeding' },
            { id: 'diarrhoea', label: 'Diarrhoea affecting feeding' },
            { id: 'mouth_sores', label: 'Mouth sores or thrush' },
            { id: 'low_breastmilk', label: 'Caregiver reports low breastmilk' },
            { id: 'other', label: 'Other concern (describe below)' },
          ],
          visibleWhen: {
            op: 'equals',
            questionId: 'feeding_difficulties',
            value: true,
          },
        },
        {
          id: 'feeding_difficulties_detail',
          label: 'Describe the feeding difficulty',
          answerType: 'text',
          required: false,
          allowNotApplicable: true,
          visibleWhen: {
            op: 'equals',
            questionId: 'feeding_difficulties',
            value: true,
          },
        },
        {
          id: 'caregiver_counselled',
          label: 'I confirm this assessment was discussed with the caregiver.',
          answerType: 'informationAcknowledgement',
          required: true,
        },
      ],
    },
  ],
};
