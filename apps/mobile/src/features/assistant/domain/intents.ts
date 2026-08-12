export const ASSISTANT_INTENTS = [
  'approvedKnowledgeQuestion',
  'appHelpQuestion',
  'workflowNavigationQuestion',
  'patientSpecificQuestion',
  'diagnosisRequest',
  'treatmentRequest',
  'medicationRequest',
  'dosageRequest',
  'emergencyOrUrgentRequest',
  'unsupportedQuestion',
  'privacySensitiveQuestion',
] as const;

export type AssistantIntent = (typeof ASSISTANT_INTENTS)[number];

/**
 * Conservative deterministic intent routing. Uncertain → unsupported.
 * Not clinical interpretation. No LLM classification.
 */
export function classifyAssistantIntent(input: {
  readonly normalisedQuestion: string;
  readonly selectedTopicId?: string | null;
  readonly privacyFlagged: boolean;
}): AssistantIntent {
  if (input.privacyFlagged) {
    return 'privacySensitiveQuestion';
  }

  const q = input.normalisedQuestion;

  if (
    /\b(emergency|urgent|immediately|unconscious|not breathing|severe bleeding|convulsion)\b/.test(
      q,
    )
  ) {
    return 'emergencyOrUrgentRequest';
  }

  if (
    /\b(this client|this child|this mother|this baby|for her|for him|should i refer|what priority|is this child safe|what condition does)\b/.test(
      q,
    )
  ) {
    return 'patientSpecificQuestion';
  }

  if (/\b(diagnos(e|is|ing)|what disease|what illness|what condition is)\b/.test(q)) {
    return 'diagnosisRequest';
  }

  if (/\b(treat(ment|ing)?|protocol|cure|therapy)\b/.test(q)) {
    return 'treatmentRequest';
  }

  if (/\b(medication|medicine|drug|antibiotic|tablet|syrup)\b/.test(q)) {
    return 'medicationRequest';
  }

  if (/\b(dosage|dose|mg\b|ml\b|how many tablets|how much medicine)\b/.test(q)) {
    return 'dosageRequest';
  }

  if (
    /\b(how to (register|lock|save|show|open)|referral qr|waiting for connection|draft)\b/.test(
      q,
    ) ||
    input.selectedTopicId?.startsWith('topic-app-help')
  ) {
    return 'appHelpQuestion';
  }

  if (/\b(open clients|start a visit|view referrals|open nutrition)\b/.test(q)) {
    return 'workflowNavigationQuestion';
  }

  if (input.selectedTopicId || q.length >= 3) {
    return 'approvedKnowledgeQuestion';
  }

  return 'unsupportedQuestion';
}
