import {
  firstTimeStepAfterSignIn,
  routeAfterSuccessfulSignIn,
  shouldSkipFacilityConfirmation,
} from '../firstTimeSetupFlow';

describe('firstTimeSetupFlow', () => {
  it('skips facility confirmation for administrators', () => {
    expect(firstTimeStepAfterSignIn('administrator')).toBe('createPin');
    expect(routeAfterSuccessfulSignIn('administrator')).toBe('/(auth)/create-pin');
    expect(shouldSkipFacilityConfirmation('administrator')).toBe(true);
  });

  it('requires facility confirmation for workers', () => {
    expect(firstTimeStepAfterSignIn('worker')).toBe('facility');
    expect(routeAfterSuccessfulSignIn('worker')).toBe('/(auth)/facility-confirmation');
    expect(shouldSkipFacilityConfirmation('worker')).toBe(false);
  });

  it('uses setup sign-in role for dual-role accounts', () => {
    expect(shouldSkipFacilityConfirmation('worker', 'administrator')).toBe(true);
    expect(routeAfterSuccessfulSignIn('worker', 'administrator')).toBe('/(auth)/create-pin');
    expect(routeAfterSuccessfulSignIn('worker', 'worker')).toBe('/(auth)/facility-confirmation');
  });
});
