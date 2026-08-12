import type { NutritionAssessmentTemplateDefinition } from '../../domain/types';

export const SYNTHETIC_DEV_MATERNAL_NUTRITION_TEMPLATE: NutritionAssessmentTemplateDefinition = {
  templateId: 'synthetic-dev-maternal-nutrition-v1',
  version: 1,
  status: 'DRAFT',
  assessmentType: 'maternalNutrition',
  title: 'Development maternal nutrition assessment (synthetic)',
  developmentBanner:
    'Development nutrition content — not clinical guidance. Synthetic maternal items only.',
  clinicalSourceRef: null,
  applicableClientCategories: ['pregnant', 'postnatal'],
  ageApplicability: {
    minAgeDays: null,
    maxAgeDays: null,
    allowApproximateAge: true,
    requireExactAge: false,
  },
  requiredMeasurementTypes: [],
  optionalMeasurementTypes: ['weight'],
  referencePackIds: ['synthetic-dev-nutrition-reference-v1'],
  guidancePackIds: ['synthetic-dev-nutrition-guidance-v1'],
  knownLimitations: [
    'Synthetic development content only.',
    'No calorie targets, supplement doses, or therapeutic diets.',
  ],
  sections: [
    {
      id: 'section-maternal',
      title: 'Example maternal items',
      questions: [
        {
          id: 'example_maternal_item_a',
          label: 'Example maternal nutrition item A',
          answerType: 'yesNo',
          required: true,
          allowUnknown: true,
          allowNotAssessed: true,
        },
        {
          id: 'example_maternal_item_b',
          label: 'Example maternal nutrition item B',
          answerType: 'singleChoice',
          required: true,
          allowNotAssessed: true,
          options: [
            { id: 'example_maternal_one', label: 'Example maternal option one' },
            { id: 'example_maternal_two', label: 'Example maternal option two' },
          ],
        },
        {
          id: 'example_maternal_ack',
          label: 'I confirm the recorded maternal nutrition information was reviewed.',
          answerType: 'informationAcknowledgement',
          required: true,
        },
      ],
    },
  ],
};
