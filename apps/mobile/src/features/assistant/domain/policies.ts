import type { AssistantIntent } from './intents';
import type { AnswerabilityOutcome } from './statuses';
import type { AssistantBoundaryResult, AssistantWorkflowLink } from './types';
import type { AssistantMode } from './modes';

const WORKFLOW_HOME: AssistantWorkflowLink = {
  linkId: 'workflow-home',
  label: 'Return to worker home',
  route: '/(worker)',
};

const WORKFLOW_CLIENTS: AssistantWorkflowLink = {
  linkId: 'workflow-clients',
  label: 'Open Clients',
  route: '/(worker)/clients',
};

const WORKFLOW_REFERRALS: AssistantWorkflowLink = {
  linkId: 'workflow-referrals',
  label: 'View referrals',
  route: '/(worker)/referrals',
};

export function intentToAnswerability(intent: AssistantIntent): AnswerabilityOutcome | null {
  switch (intent) {
    case 'patientSpecificQuestion':
      return 'patientSpecificBoundary';
    case 'diagnosisRequest':
      return 'diagnosisBoundary';
    case 'treatmentRequest':
      return 'treatmentBoundary';
    case 'medicationRequest':
      return 'medicationBoundary';
    case 'dosageRequest':
      return 'dosageBoundary';
    case 'emergencyOrUrgentRequest':
      return 'urgentBoundary';
    case 'privacySensitiveQuestion':
      return 'privacyReviewRequired';
    case 'unsupportedQuestion':
      return 'unsupportedTopic';
    default:
      return null;
  }
}

export function buildBoundaryResult(input: {
  readonly answerId: string;
  readonly answerability: AnswerabilityOutcome;
  readonly mode: AssistantMode;
  readonly answeredAt: string;
  readonly developmentBanner: string | null;
  readonly relatedTopicIds?: readonly string[];
}): AssistantBoundaryResult {
  const copy = boundaryCopy(input.answerability);
  return {
    answerId: input.answerId,
    answerability: input.answerability,
    heading: copy.heading,
    body: copy.body,
    relatedTopicIds: input.relatedTopicIds ?? [],
    workflowLinks: copy.workflowLinks,
    mode: input.mode,
    answeredAt: input.answeredAt,
    developmentBanner: input.developmentBanner,
  };
}

function boundaryCopy(outcome: AnswerabilityOutcome): {
  heading: string;
  body: string;
  workflowLinks: readonly AssistantWorkflowLink[];
} {
  switch (outcome) {
    case 'patientSpecificBoundary':
      return {
        heading: 'Individual client assessment not available',
        body: 'Ask NorthCare cannot assess an individual client. Use the approved screening, priority and referral workflows, or consult the authorised clinical supervisor.',
        workflowLinks: [WORKFLOW_CLIENTS, WORKFLOW_REFERRALS, WORKFLOW_HOME],
      };
    case 'diagnosisBoundary':
      return {
        heading: 'Diagnosis not available',
        body: 'Ask NorthCare does not diagnose conditions. Use approved screening workflows and consult the authorised clinical supervisor.',
        workflowLinks: [WORKFLOW_CLIENTS, WORKFLOW_HOME],
      };
    case 'treatmentBoundary':
      return {
        heading: 'Treatment guidance not available',
        body: 'Ask NorthCare does not provide treatment recommendations. Follow approved clinical procedures or consult the authorised clinical supervisor.',
        workflowLinks: [WORKFLOW_HOME],
      };
    case 'medicationBoundary':
    case 'dosageBoundary':
      return {
        heading: 'Medication guidance not available',
        body: 'Ask NorthCare does not recommend medicines or dosages. Do not use the assistant for medication decisions.',
        workflowLinks: [WORKFLOW_HOME],
      };
    case 'urgentBoundary':
      return {
        heading: 'Use approved urgent assessment',
        body: 'Do not wait for the assistant. Use the approved urgent-assessment and referral procedure, and contact the authorised supervisor or emergency pathway available to you. Ask NorthCare does not dispatch emergency services and does not invent emergency numbers.',
        workflowLinks: [WORKFLOW_REFERRALS, WORKFLOW_HOME],
      };
    case 'privacyReviewRequired':
      return {
        heading: 'Remove identifying details',
        body: 'Do not enter names, phone numbers or other identifying details. Reword the question as a general care reference question.',
        workflowLinks: [WORKFLOW_HOME],
      };
    case 'contentUnavailable':
    case 'assistantUnavailable':
      return {
        heading: 'Approved reference content unavailable',
        body: 'Ask NorthCare could not find approved information for this question on this device. View approved topics, reword a general question, use the relevant NorthCare workflow, or consult the authorised clinical supervisor.',
        workflowLinks: [WORKFLOW_HOME],
      };
    default:
      return {
        heading: 'No approved answer available',
        body: 'Ask NorthCare could not find approved information for this question on this device. The assistant has not generated an answer. Use approved workflows or consult an authorised supervisor.',
        workflowLinks: [WORKFLOW_HOME],
      };
  }
}
