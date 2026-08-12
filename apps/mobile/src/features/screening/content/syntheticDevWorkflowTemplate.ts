import type { ScreeningTemplateDefinition } from './types';

/**
 * Synthetic DEVELOPMENT WORKFLOW TEMPLATE — NOT CLINICAL GUIDANCE.
 * Used for offline visit/screening workflow development and tests only.
 * Do not treat wording as medical protocol, danger-sign criteria, or thresholds.
 */
export const SYNTHETIC_DEV_WORKFLOW_TEMPLATE: ScreeningTemplateDefinition = {
  templateId: 'synthetic-dev-workflow-v1',
  version: 1,
  status: 'APPROVED_FOR_DEVELOPMENT',
  screeningType: 'antenatal',
  title: 'Development workflow screening (synthetic)',
  developmentBanner:
    'DEVELOPMENT WORKFLOW TEMPLATE — NOT CLINICAL GUIDANCE. Synthetic assessment items only.',
  clinicalSourceRef: null,
  sections: [
    {
      id: 'section-a',
      title: 'Assessment items A',
      description: 'Synthetic section for workflow testing. Not a clinical form.',
      questions: [
        {
          id: 'item_a1',
          label: 'Assessment item A1',
          helpText: 'Select an answer. No clinical default is applied.',
          answerType: 'yesNo',
          required: true,
          allowUnknown: true,
          allowNotAssessed: true,
        },
        {
          id: 'item_a2',
          label: 'Assessment item A2',
          answerType: 'singleChoice',
          required: true,
          allowNotAssessed: true,
          options: [
            { id: 'option_one', label: 'Option one' },
            { id: 'option_two', label: 'Option two' },
            { id: 'option_three', label: 'Option three' },
          ],
        },
        {
          id: 'item_a3_detail',
          label: 'Assessment item A3 (shown when A2 is option two)',
          answerType: 'text',
          required: false,
          allowNotApplicable: true,
          visibleWhen: {
            op: 'equals',
            questionId: 'item_a2',
            value: 'option_two',
          },
        },
      ],
    },
    {
      id: 'section-b',
      title: 'Assessment items B',
      description: 'Synthetic measurements and acknowledgements. No interpretation colours.',
      questions: [
        {
          id: 'item_b1_weight',
          label: 'Assessment item B1 (measurement entry)',
          helpText: 'Enter a numeric value with the controlled unit. No normal/abnormal label.',
          answerType: 'measurement',
          required: true,
          allowNotAssessed: true,
          measurementType: 'weight',
          measurementUnit: 'kg',
        },
        {
          id: 'item_b2',
          label: 'Assessment item B2',
          answerType: 'integer',
          required: false,
          allowUnknown: true,
        },
        {
          id: 'item_b3_ack',
          label: 'I confirm the information above was reviewed with the client or caregiver.',
          answerType: 'informationAcknowledgement',
          required: true,
        },
      ],
    },
    {
      id: 'section-c',
      title: 'Assessment items C',
      description: 'Final synthetic section before review.',
      questions: [
        {
          id: 'item_c1',
          label: 'Assessment item C1',
          answerType: 'multipleChoice',
          required: false,
          allowDeclined: true,
          options: [
            { id: 'choice_x', label: 'Choice X' },
            { id: 'choice_y', label: 'Choice Y' },
            { id: 'choice_z', label: 'Choice Z' },
          ],
        },
        {
          id: 'item_c2',
          label: 'Assessment item C2',
          answerType: 'date',
          required: false,
          allowNotAssessed: true,
        },
      ],
    },
  ],
};
