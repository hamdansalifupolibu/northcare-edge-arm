/** Map legacy mobile enqueue aliases to sync protocol v1 registry names. */
const ALIASES: Readonly<Record<string, string>> = {
  nutritionAssessment: 'nutrition_assessment',
  nutritionReferenceResult: 'nutrition_reference_result',
  nutritionGuidanceResolution: 'nutrition_guidance_resolution',
  voiceCaptureSession: 'voice_capture_session',
  voiceTranscript: 'voice_transcript',
  voiceExtractionRun: 'voice_extraction_run',
  riskAssessment: 'risk_assessment',
  referralEvent: 'referral_event',
  referralPassport: 'referral_passport',
  clientRelationship: 'client_relationship',
  assistantFeedback: 'assistant_feedback',
  followUpReminder: 'follow_up_reminder',
};

export function normalizeSyncEntityType(entityType: string): string {
  return ALIASES[entityType] ?? entityType;
}
