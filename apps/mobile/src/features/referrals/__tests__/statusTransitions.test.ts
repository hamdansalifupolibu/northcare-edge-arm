import {
  assertCanTransitionReferralStatus,
  canTransitionReferralStatus,
} from '../domain/statusTransitions';
import { ReferralError } from '../domain/errors';

describe('referral status transitions', () => {
  it('allows expected happy-path transitions', () => {
    expect(canTransitionReferralStatus('draft', 'created')).toBe(true);
    expect(canTransitionReferralStatus('created', 'caregiverInformed')).toBe(true);
    expect(canTransitionReferralStatus('caregiverInformed', 'journeyStarted')).toBe(true);
    expect(canTransitionReferralStatus('journeyStarted', 'facilityReached')).toBe(true);
    expect(canTransitionReferralStatus('facilityReached', 'patientReceived')).toBe(true);
    expect(canTransitionReferralStatus('patientReceived', 'completed')).toBe(true);
  });

  it('rejects invalid and terminal transitions', () => {
    expect(canTransitionReferralStatus('draft', 'completed')).toBe(false);
    expect(canTransitionReferralStatus('completed', 'created')).toBe(false);
    expect(canTransitionReferralStatus('cancelled', 'created')).toBe(false);
    expect(canTransitionReferralStatus('created', 'created')).toBe(false);
    expect(() => assertCanTransitionReferralStatus('draft', 'facilityReached')).toThrow(
      ReferralError,
    );
  });
});
