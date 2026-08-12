import type { WorkspaceId } from './workspaces';

export type AuthRole = 'worker' | 'administrator';

export type RemoteAuthStatus =
  | 'idle'
  | 'authenticating'
  | 'authenticated'
  | 'rejected'
  | 'unavailable'
  | 'accountInactive'
  | 'passwordChangeRequired'
  | 'roleMismatch'
  | 'facilityConfirmationRequired'
  | 'networkUnavailable';

export type LocalUnlockStatus =
  | 'unavailable'
  | 'locked'
  | 'unlocking'
  | 'unlocked'
  | 'failed'
  | 'temporarilyLocked'
  | 'biometricUnavailable'
  | 'biometricInvalidated';

export type AuthSessionState =
  | 'preparing'
  | 'signedOut'
  | 'remoteAuthenticationRequired'
  | 'firstTimeSetupRequired'
  | 'locked'
  | 'authenticated'
  | 'workspaceSelectionRequired'
  | 'sessionExpired'
  | 'accessRevoked'
  | 'error';

export type AccountStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'accessRevoked'
  | 'passwordResetRequired'
  | 'facilityChanged';

export type AuthAccount = {
  readonly accountId: string;
  readonly displayName: string;
  readonly role: AuthRole;
  readonly availableRoles: readonly AuthRole[];
  readonly permittedWorkspaces: readonly WorkspaceId[];
  readonly accountVersion?: number;
  readonly facilityId: string;
  readonly facilityName: string;
  readonly facilityType?: string;
  readonly districtOrRegion?: string;
  readonly organisationId: string;
  readonly organisationName: string;
  readonly isActive: boolean;
  readonly status: AccountStatus;
  readonly requiresPasswordChange: boolean;
  readonly remoteAuthenticationTime: string;
  readonly offlineAccessPolicyVersion: number;
};

export type SignInCredentials = {
  readonly loginIdentifier: string;
  readonly password: string;
  readonly expectedRole: AuthRole;
};

export type SafeAuthErrorCode =
  | 'invalidCredentials'
  | 'networkUnavailable'
  | 'tooManyAttempts'
  | 'accountInactive'
  | 'passwordChangeRequired'
  | 'roleMismatch'
  | 'serviceUnavailable'
  | 'accessRevoked'
  | 'cancelled'
  | 'unknown';

export type SafeAuthError = {
  readonly code: SafeAuthErrorCode;
  readonly messageKey: string;
};

export type BiometricAvailability =
  | 'available'
  | 'notAvailable'
  | 'notEnrolled'
  | 'weakOnly'
  | 'enabled'
  | 'declined'
  | 'failed'
  | 'invalidated';
