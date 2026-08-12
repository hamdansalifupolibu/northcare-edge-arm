/**
 * Central emergency presentation copy for Reach R5.
 * Truthful simulation wording only — no ambulance / clinical severity claims.
 */

export const EMERGENCY_REQUIRED_PHRASES = [
  'Emergency coordination simulation',
  'call 112',
  'Live emergency-service integration is pending',
  'further human support',
] as const;

export const EMERGENCY_FORBIDDEN_PHRASES = [
  'Ambulance dispatched',
  'Ambulance assigned',
  'Ambulance on the way',
  'Emergency service contacted',
  'Severe emergency',
  'Major emergency',
  'Moderate emergency',
  'RED PRIORITY',
  'Ambulance needed',
  'Critical patient',
  'Life-threatening emergency',
  'Call ambulance',
  'Dispatch ambulance',
  'Send emergency team',
  'Transfer to National Ambulance Service',
  'Responder on the way',
  'Facility alerted',
] as const;

export function emergencyFilterHeading(): string {
  return 'Emergency assistance requests';
}

export function emergencyFilterExplanation(): string {
  return 'These requests were submitted through the NorthCare Reach emergency simulation.';
}

export function emergencyLiveIntegrationPending(): string {
  return 'Live emergency-service integration is not active.';
}

export function emergencyCoordinationBannerTitle(): string {
  return 'Emergency coordination simulation';
}

export function emergencyCall112Reminder(): string {
  return 'If someone is in immediate danger, the requester should call 112.';
}

export function emergencyLiveIntegrationPendingDetail(): string {
  return 'Live emergency-service integration is pending.';
}

export function emergencyPrivacyReminder(): string {
  return 'Use the contact and landmark information only to coordinate this request.';
}

export function escalateConfirmTitle(): string {
  return 'Escalate request?';
}

export function escalateConfirmBody(): string {
  return 'This will record that the request needs further human support. It will not contact or dispatch an ambulance.';
}

export function escalateSuccessMessage(): string {
  return 'Request escalated for further support.';
}

export function escalateFailureGeneric(): string {
  return 'This request could not be escalated. Refresh and try again.';
}

export function escalateFailureConflict(): string {
  return 'This request has changed. Refresh to view its current status.';
}

export function escalateFailureForbidden(): string {
  return 'You are not authorised to escalate this request.';
}

export function emergencyHandledMeaning(): string {
  return 'Handled means this NorthCare request has been addressed. It does not confirm the outcome of the emergency.';
}

export function containsForbiddenEmergencyWording(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_FORBIDDEN_PHRASES.some((phrase) => lower.includes(phrase.toLowerCase()));
}

export function assertEmergencySafetyWording(combinedCopy: string): {
  readonly missingRequired: string[];
  readonly foundForbidden: string[];
} {
  const lower = combinedCopy.toLowerCase();
  const missingRequired = EMERGENCY_REQUIRED_PHRASES.filter(
    (phrase) => !lower.includes(phrase.toLowerCase()),
  );
  const foundForbidden = EMERGENCY_FORBIDDEN_PHRASES.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );
  return { missingRequired: [...missingRequired], foundForbidden: [...foundForbidden] };
}
