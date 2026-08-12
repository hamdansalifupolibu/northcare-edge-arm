import type { AuthAccount, AuthRole, SafeAuthError, SignInCredentials } from '../domain/types';

export type PasswordPolicy = {
  readonly minLength: number;
  readonly requireMixedCase: boolean;
  readonly requireDigit: boolean;
};

export type SignInSuccess = {
  readonly ok: true;
  readonly account: AuthAccount;
};

export type SignInFailure = {
  readonly ok: false;
  readonly error: SafeAuthError;
  /** Present when further setup can continue (e.g. password change). */
  readonly account?: AuthAccount;
};

export type SignInResult = SignInSuccess | SignInFailure;

export type PasswordResetResult = {
  readonly ok: true;
  /** Always generic — never reveals account existence. */
  readonly genericMessageKey: 'recoverySubmitted';
};

export type ChangePasswordInput = {
  readonly accountId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
};

export type RemoteAuthProvider = {
  readonly id: 'development' | 'firebase' | 'unavailable';
  signIn(credentials: SignInCredentials): Promise<SignInResult>;
  signOut(): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<SignInResult>;
  requestPasswordReset(loginIdentifier: string): Promise<PasswordResetResult>;
  getCurrentAccount(): Promise<AuthAccount | null>;
  refreshAccountStatus(accountId: string): Promise<SignInResult>;
  getPasswordPolicy(): PasswordPolicy;
  /** Development-only synthetic helpers */
  simulateNetworkUnavailable?: boolean;
};

export type ExpectedRoleCheck = {
  readonly expectedRole: AuthRole;
  readonly accountRole: AuthRole;
};

export function rolesMatch(check: ExpectedRoleCheck): boolean {
  return check.expectedRole === check.accountRole;
}
