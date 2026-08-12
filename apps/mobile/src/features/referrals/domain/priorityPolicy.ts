import type {
  ReferralOrigin,
  ReferralPrioritySource,
  RiskPriority,
} from '../../../data/domain/enums/domainEnums';
import { ReferralError } from './errors';

export type ResolvedReferralPriority = {
  readonly priority: RiskPriority;
  readonly prioritySource: ReferralPrioritySource;
};

/**
 * Resolve referral priority without inventing or casually downgrading engine results.
 * Worker-initiated referrals without an assessment use undetermined / noEnginePriority.
 */
export function resolveReferralPriority(input: {
  readonly origin: ReferralOrigin;
  readonly enginePriority?: RiskPriority | null;
  readonly riskAssessmentId?: string | null;
}): ResolvedReferralPriority {
  if (input.origin === 'priorityAssessment') {
    if (!input.riskAssessmentId || !input.enginePriority) {
      throw new ReferralError(
        'assessmentRequired',
        'A saved priority assessment is required to start this referral.',
      );
    }
    return {
      priority: input.enginePriority,
      prioritySource: 'fromEngine',
    };
  }

  if (input.riskAssessmentId && input.enginePriority) {
    return {
      priority: input.enginePriority,
      prioritySource: 'preservedEngine',
    };
  }

  return {
    priority: 'undetermined',
    prioritySource: 'noEnginePriority',
  };
}

/**
 * Reject casual priority downgrades against a linked assessment result.
 */
export function assertPriorityNotCasuallyDowngraded(input: {
  readonly linkedEnginePriority: RiskPriority | null;
  readonly requestedPriority: RiskPriority;
  readonly prioritySource: ReferralPrioritySource;
}): void {
  if (
    input.prioritySource !== 'fromEngine' &&
    input.prioritySource !== 'preservedEngine'
  ) {
    return;
  }
  if (!input.linkedEnginePriority) {
    return;
  }
  if (input.requestedPriority !== input.linkedEnginePriority) {
    throw new ReferralError(
      'priorityPolicyViolation',
      'Referral priority must preserve the linked assessment priority.',
    );
  }
}
