export type AdministrationErrorCode =
  | 'administrationRequiresConnectivity'
  | 'administratorAuthenticationRequired'
  | 'administratorReauthenticationRequired'
  | 'administratorRoleRequired'
  | 'accountNotFound'
  | 'accountAlreadyExists'
  | 'accountVersionConflict'
  | 'facilityNotFound'
  | 'facilityNotAssignable'
  | 'identityProviderUnavailable'
  | 'identityProvisioningFailed'
  | 'passwordResetUnavailable'
  | 'invalidAccountTransition'
  | 'lastAdministratorProtected'
  | 'deviceNotFound'
  | 'deviceAlreadyRevoked'
  | 'forbidden'
  | 'validationFailed'
  | 'backendUnavailable'
  | 'internalError'
  | 'idempotencyKeyConflict'
  | 'profileVersionConflict'
  | 'workerRoleRequired'
  | 'unknown';

export class AdministrationError extends Error {
  readonly code: AdministrationErrorCode;

  constructor(code: AdministrationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AdministrationError';
    this.code = code;
  }
}

export class AdministrationOfflineError extends AdministrationError {
  constructor() {
    super('administrationRequiresConnectivity');
  }
}

export class AdministrationForbiddenError extends AdministrationError {
  constructor() {
    super('forbidden');
  }
}

export function parseAdministrationErrorCode(detail: unknown): AdministrationErrorCode {
  if (typeof detail === 'object' && detail !== null) {
    const code = (detail as { code?: unknown }).code;
    if (typeof code === 'string') {
      return code as AdministrationErrorCode;
    }
  }
  return 'unknown';
}
