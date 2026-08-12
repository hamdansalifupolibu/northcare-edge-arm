import type { WorkspacePreference } from '../preferences';
import { isOnboardingCompleteForVersion } from '../preferences';
import { CURRENT_ONBOARDING_VERSION } from '../preferences/onboardingVersion';

/**
 * Launch states that genuinely exist at Stage 4.
 * Authentication is represented as an extension point only — never claimed as authenticated.
 */
export type LaunchState =
  | 'preparing'
  | 'firstLaunch'
  | 'onboardingComplete'
  | 'workspaceNotSelected'
  | 'workerAuthenticationRequired'
  | 'administratorAuthenticationRequired'
  | 'launchError';

export type LaunchInput = {
  readonly foundationReady: boolean;
  readonly onboardingVersionCompleted: number | null;
  readonly selectedWorkspace: WorkspacePreference | null;
  readonly preferenceError?: boolean;
  readonly currentOnboardingVersion?: number;
};

export type LaunchRoute =
  | '/(entry)/splash'
  | '/(entry)/onboarding'
  | '/(entry)/workspace-selection'
  | '/(auth)/worker-login'
  | '/(auth)/admin-login'
  | '/(entry)/launch-error';

export function resolveLaunchState(input: LaunchInput): LaunchState {
  if (input.preferenceError) {
    return 'launchError';
  }
  if (!input.foundationReady) {
    return 'preparing';
  }

  const currentVersion = input.currentOnboardingVersion ?? CURRENT_ONBOARDING_VERSION;
  const onboardingDone = isOnboardingCompleteForVersion(
    input.onboardingVersionCompleted,
    currentVersion,
  );

  if (!onboardingDone) {
    return 'firstLaunch';
  }

  if (input.selectedWorkspace === null) {
    return 'workspaceNotSelected';
  }

  if (input.selectedWorkspace === 'worker') {
    return 'workerAuthenticationRequired';
  }

  return 'administratorAuthenticationRequired';
}

export function routeForLaunchState(state: LaunchState): LaunchRoute {
  switch (state) {
    case 'preparing':
    case 'firstLaunch':
    case 'onboardingComplete':
    case 'workspaceNotSelected':
    case 'workerAuthenticationRequired':
    case 'administratorAuthenticationRequired':
      // Custom splash always owns the first paint, then redirects.
      return '/(entry)/splash';
    case 'launchError':
      return '/(entry)/launch-error';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function postSplashRoute(state: LaunchState): LaunchRoute {
  switch (state) {
    case 'firstLaunch':
      return '/(entry)/onboarding';
    case 'workspaceNotSelected':
    case 'onboardingComplete':
      return '/(entry)/workspace-selection';
    case 'workerAuthenticationRequired':
      return '/(auth)/worker-login';
    case 'administratorAuthenticationRequired':
      return '/(auth)/admin-login';
    case 'launchError':
      return '/(entry)/launch-error';
    case 'preparing':
      return '/(entry)/splash';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
