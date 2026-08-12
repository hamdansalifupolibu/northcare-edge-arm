import { CURRENT_ONBOARDING_VERSION } from '../preferences/onboardingVersion';
import {
  postSplashRoute,
  resolveLaunchState,
  routeForLaunchState,
} from '../launch/launchState';

describe('resolveLaunchState', () => {
  it('returns preparing when foundation is not ready', () => {
    expect(
      resolveLaunchState({
        foundationReady: false,
        onboardingVersionCompleted: null,
        selectedWorkspace: null,
      }),
    ).toBe('preparing');
  });

  it('returns firstLaunch when onboarding is incomplete', () => {
    expect(
      resolveLaunchState({
        foundationReady: true,
        onboardingVersionCompleted: null,
        selectedWorkspace: null,
      }),
    ).toBe('firstLaunch');
  });

  it('returns workspaceNotSelected when onboarding done but no workspace', () => {
    expect(
      resolveLaunchState({
        foundationReady: true,
        onboardingVersionCompleted: CURRENT_ONBOARDING_VERSION,
        selectedWorkspace: null,
      }),
    ).toBe('workspaceNotSelected');
  });

  it('returns workerAuthenticationRequired for worker workspace', () => {
    expect(
      resolveLaunchState({
        foundationReady: true,
        onboardingVersionCompleted: CURRENT_ONBOARDING_VERSION,
        selectedWorkspace: 'worker',
      }),
    ).toBe('workerAuthenticationRequired');
  });

  it('returns administratorAuthenticationRequired for administrator workspace', () => {
    expect(
      resolveLaunchState({
        foundationReady: true,
        onboardingVersionCompleted: CURRENT_ONBOARDING_VERSION,
        selectedWorkspace: 'administrator',
      }),
    ).toBe('administratorAuthenticationRequired');
  });

  it('returns launchError when preferenceError is set', () => {
    expect(
      resolveLaunchState({
        foundationReady: true,
        onboardingVersionCompleted: null,
        selectedWorkspace: null,
        preferenceError: true,
      }),
    ).toBe('launchError');
  });
});

describe('postSplashRoute', () => {
  it('routes first launch to onboarding', () => {
    expect(postSplashRoute('firstLaunch')).toBe('/(entry)/onboarding');
  });

  it('routes returning worker to worker login', () => {
    expect(postSplashRoute('workerAuthenticationRequired')).toBe('/(auth)/worker-login');
  });
});

describe('routeForLaunchState', () => {
  it('sends normal launches through splash', () => {
    expect(routeForLaunchState('firstLaunch')).toBe('/(entry)/splash');
  });
});
