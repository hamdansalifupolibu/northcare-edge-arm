import { getAppConfig } from '../../../config/appConfig';
import type { AppEnvironment } from '../../../types/env';
import { ReferralError } from '../domain/errors';
import { SYNTHETIC_DEV_REFERRAL_REASONS } from './development/syntheticDevReferralReasons';
import type { ReferralReasonContentStatus, ReferralReasonDefinition } from './types';

const ALL_REASONS: readonly ReferralReasonDefinition[] = [
  ...SYNTHETIC_DEV_REFERRAL_REASONS,
  // approved/ remains empty until clinically reviewed APPROVED_FOR_PILOT reasons exist.
];

function allowedStatusesForEnvironment(
  environment: AppEnvironment,
): readonly ReferralReasonContentStatus[] {
  if (environment === 'production') {
    return ['APPROVED_FOR_PILOT'];
  }
  return ['APPROVED_FOR_DEVELOPMENT', 'APPROVED_FOR_PILOT'];
}

export function listLoadableReferralReasons(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly ReferralReasonDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_REASONS.filter(
    (reason) =>
      allowed.has(reason.status) &&
      reason.status !== 'RETIRED' &&
      reason.status !== 'DRAFT' &&
      reason.status !== 'CLINICAL_REVIEW_REQUIRED',
  );
}

export function getReferralReasonByCode(
  reasonCode: string,
  environment: AppEnvironment = getAppConfig().appEnv,
): ReferralReasonDefinition | null {
  return (
    listLoadableReferralReasons(environment).find((r) => r.reasonCode === reasonCode) ??
    null
  );
}

export function requireReferralReason(
  reasonCode: string,
  environment: AppEnvironment = getAppConfig().appEnv,
): ReferralReasonDefinition {
  const reason = getReferralReasonByCode(reasonCode, environment);
  if (!reason) {
    throw new ReferralError(
      'reasonUnavailable',
      'An approved referral reason is not available for this environment.',
    );
  }
  return reason;
}

export function listAllRegisteredReferralReasonsForInventory(): readonly ReferralReasonDefinition[] {
  return ALL_REASONS;
}

export function countApprovedForPilotReferralReasons(): number {
  return ALL_REASONS.filter((r) => r.status === 'APPROVED_FOR_PILOT').length;
}
