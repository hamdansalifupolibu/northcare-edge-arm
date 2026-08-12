import type { AppEnvironment } from '../../../../types/env';
import { AssistantError } from '../../domain/errors';
import type { AssistantIntent } from '../../domain/intents';

export type DevelopmentScenarioId =
  | 'exactMatch'
  | 'keywordMatch'
  | 'multipleSources'
  | 'unsupported'
  | 'patientSpecific'
  | 'diagnosis'
  | 'treatment'
  | 'medication'
  | 'urgent'
  | 'privacyWarning'
  | 'longAnswer'
  | 'retiredArticle'
  | 'providerUnavailable';

export const DEVELOPMENT_SCENARIOS: readonly {
  readonly id: DevelopmentScenarioId;
  readonly label: string;
  readonly sampleQuestion: string;
  readonly expectedIntent?: AssistantIntent;
}[] = [
  {
    id: 'exactMatch',
    label: 'Exact-match answer',
    sampleQuestion: 'What is example care topic A',
  },
  {
    id: 'keywordMatch',
    label: 'Keyword-match answer',
    sampleQuestion: 'example care hydration rest follow-up',
  },
  {
    id: 'multipleSources',
    label: 'Multiple sources',
    sampleQuestion: 'Show long development reference C',
  },
  {
    id: 'unsupported',
    label: 'Unsupported question',
    sampleQuestion: 'zzzz unrelated quantum bamboo orchard',
  },
  {
    id: 'patientSpecific',
    label: 'Patient-specific boundary',
    sampleQuestion: 'What condition does this client have?',
    expectedIntent: 'patientSpecificQuestion',
  },
  {
    id: 'diagnosis',
    label: 'Diagnosis boundary',
    sampleQuestion: 'Please diagnose this illness',
    expectedIntent: 'diagnosisRequest',
  },
  {
    id: 'treatment',
    label: 'Treatment boundary',
    sampleQuestion: 'What treatment protocol should I use?',
    expectedIntent: 'treatmentRequest',
  },
  {
    id: 'medication',
    label: 'Medication boundary',
    sampleQuestion: 'What medicine should I give?',
    expectedIntent: 'medicationRequest',
  },
  {
    id: 'urgent',
    label: 'Urgent boundary',
    sampleQuestion: 'This is an emergency and not breathing',
    expectedIntent: 'emergencyOrUrgentRequest',
  },
  {
    id: 'privacyWarning',
    label: 'Privacy warning',
    sampleQuestion: 'Can I ask about +233 20 123 4567?',
  },
  {
    id: 'longAnswer',
    label: 'Long answer',
    sampleQuestion: 'Show long development reference C',
  },
  {
    id: 'retiredArticle',
    label: 'Retired article id',
    sampleQuestion: 'retired synthetic article question',
  },
  {
    id: 'providerUnavailable',
    label: 'Generative provider unavailable',
    sampleQuestion: 'unused',
  },
];

export function assertDevelopmentSimulationAllowed(environment: AppEnvironment): void {
  if (environment === 'production') {
    throw new AssistantError(
      'productionGate',
      'Development assistant simulation is blocked in production.',
    );
  }
}

export const DEVELOPMENT_SIMULATION_BANNER =
  'Development assistant simulation — not clinical guidance';
