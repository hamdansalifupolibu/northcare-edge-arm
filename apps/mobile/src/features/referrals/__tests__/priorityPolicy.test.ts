import {
  assertPriorityNotCasuallyDowngraded,
  resolveReferralPriority,
} from '../domain/priorityPolicy';
import { ReferralError } from '../domain/errors';

describe('referral priority policy', () => {
  it('preserves engine priority for priorityAssessment origin', () => {
    expect(
      resolveReferralPriority({
        origin: 'priorityAssessment',
        enginePriority: 'red',
        riskAssessmentId: '00000000-0000-4000-8000-000000000010',
      }),
    ).toEqual({ priority: 'red', prioritySource: 'fromEngine' });
  });

  it('uses undetermined / noEnginePriority for worker-initiated without assessment', () => {
    expect(
      resolveReferralPriority({
        origin: 'workerInitiated',
      }),
    ).toEqual({ priority: 'undetermined', prioritySource: 'noEnginePriority' });
  });

  it('rejects casual downgrade of linked engine priority', () => {
    expect(() =>
      assertPriorityNotCasuallyDowngraded({
        linkedEnginePriority: 'red',
        requestedPriority: 'green',
        prioritySource: 'fromEngine',
      }),
    ).toThrow(ReferralError);
  });
});
