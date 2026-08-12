import type { ExtractionSchemaDefinition } from '../types';

/**
 * Voice extraction schema for community health worker case notes.
 * Defines the structured fields the AI should extract from a transcribed
 * voice recording during a home visit.
 */
export const SYNTHETIC_DEV_EXTRACTION_SCHEMA: ExtractionSchemaDefinition = {
  schemaId: 'voice.encounter-notes.v1',
  title: 'Voice-to-Care Encounter Notes Extraction',
  version: 2,
  status: 'APPROVED_FOR_DEVELOPMENT',
  applicableClientCategories: ['pregnant', 'postnatal', 'newborn', 'childUnderFive'],
  applicableVisitTypes: [
    'antenatalVisit',
    'postnatalVisit',
    'newbornVisit',
    'childVisit',
    'followUp',
    'other',
  ],
  applicableScreeningTemplates: ['*'],
  allowedTargets: [
    {
      targetType: 'encounterContext',
      targetKey: 'clientName',
      valueType: 'text',
      requiredReview: true,
      label: 'Client / patient name',
    },
    {
      targetType: 'encounterContext',
      targetKey: 'babyName',
      valueType: 'text',
      requiredReview: true,
      label: 'Baby / child name',
    },
    {
      targetType: 'encounterContext',
      targetKey: 'ageOrDateOfBirth',
      valueType: 'text',
      requiredReview: true,
      label: 'Age or date of birth',
    },
    {
      targetType: 'encounterContext',
      targetKey: 'reason',
      valueType: 'text',
      requiredReview: true,
      label: 'Reason for visit / main concern',
    },
    {
      targetType: 'controlledVisitNote',
      targetKey: 'symptomsObserved',
      valueType: 'note',
      requiredReview: true,
      label: 'Symptoms reported or observed',
    },
    {
      targetType: 'measurementDraft',
      targetKey: 'temperature',
      valueType: 'measurement',
      requiredReview: true,
      label: 'Body temperature',
    },
    {
      targetType: 'measurementDraft',
      targetKey: 'weight',
      valueType: 'measurement',
      requiredReview: true,
      label: 'Body weight',
    },
    {
      targetType: 'encounterContext',
      targetKey: 'feedingStatus',
      valueType: 'text',
      requiredReview: true,
      label: 'Breastfeeding / feeding status',
    },
    {
      targetType: 'encounterContext',
      targetKey: 'urgencyLevel',
      valueType: 'text',
      requiredReview: true,
      label: 'Urgency level (low / moderate / high / critical)',
    },
    {
      targetType: 'controlledVisitNote',
      targetKey: 'actionTaken',
      valueType: 'note',
      requiredReview: true,
      label: 'Action taken or recommended',
    },
    {
      targetType: 'controlledVisitNote',
      targetKey: 'visitSummary',
      valueType: 'note',
      requiredReview: true,
      label: 'Visit summary',
    },
  ],
  reviewRequirements: [
    'Worker confirmation required before applying extracted data.',
    'Missing speech must not become No.',
  ],
  sourceReferences: ['NorthCare AI hackathon — community health worker voice notes'],
  clinicalReviewStatus: 'notReviewed',
  languageSupport: ['en'],
  providerCompatibility: ['offline.qwen.extraction.v1', 'development.simulation.extraction.v1'],
  developmentBanner:
    'Development schema. Not for pilot clinical use.',
};
