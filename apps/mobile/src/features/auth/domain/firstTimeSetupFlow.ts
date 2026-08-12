import type { AuthRole } from './types';

export type FirstTimeSetupStep =
  | 'passwordChange'
  | 'facility'
  | 'createPin'
  | 'confirmPin'
  | 'biometric'
  | 'complete';

/** Administrators skip facility confirmation — facility is operational, not identity. */
export function firstTimeStepAfterSignIn(expectedRole: AuthRole): FirstTimeSetupStep {
  return expectedRole === 'administrator' ? 'createPin' : 'facility';
}

export function roleForFirstTimeSetup(
  accountRole: AuthRole,
  setupSignInRole: AuthRole | null,
): AuthRole {
  return setupSignInRole ?? accountRole;
}

export function routeAfterSuccessfulSignIn(
  accountRole: AuthRole,
  setupSignInRole: AuthRole | null = null,
): string {
  return firstTimeStepAfterSignIn(roleForFirstTimeSetup(accountRole, setupSignInRole)) === 'createPin'
    ? '/(auth)/create-pin'
    : '/(auth)/facility-confirmation';
}

export function shouldSkipFacilityConfirmation(
  accountRole: AuthRole,
  setupSignInRole: AuthRole | null = null,
): boolean {
  return roleForFirstTimeSetup(accountRole, setupSignInRole) === 'administrator';
}
