import type { ReferralReasonDefinition } from '../types';

/**
 * Development placeholder referral reason templates.
 * Plain-language labels for UI testing — not clinical guidance.
 */
export const SYNTHETIC_DEV_REFERRAL_REASONS: readonly ReferralReasonDefinition[] = [
  {
    reasonCode: 'dev.further_assessment',
    version: 1,
    status: 'APPROVED_FOR_DEVELOPMENT',
    label: 'Further assessment needed at facility',
    description: 'The client needs a fuller check at a higher-level facility.',
    applicableCategories: ['any'],
    developmentOnly: true,
  },
  {
    reasonCode: 'dev.urgent_follow_up',
    version: 1,
    status: 'APPROVED_FOR_DEVELOPMENT',
    label: 'Urgent follow-up required',
    description: 'The client should be seen soon at the receiving facility.',
    applicableCategories: ['any'],
    developmentOnly: true,
  },
  {
    reasonCode: 'dev.specialist_care',
    version: 1,
    status: 'APPROVED_FOR_DEVELOPMENT',
    label: 'Specialist or higher-level care needed',
    description: 'Care at this level is beyond what can be provided here.',
    applicableCategories: ['any'],
    developmentOnly: true,
  },
  {
    reasonCode: 'dev.monitoring_concern',
    version: 1,
    status: 'APPROVED_FOR_DEVELOPMENT',
    label: 'Concern that needs closer monitoring',
    description: 'Signs or history suggest the client should be monitored at facility level.',
    applicableCategories: ['any'],
    developmentOnly: true,
  },
];
