import type { AppStrings } from '../../../i18n/en';
import { en } from '../../../i18n/en';
import type { SafeAuthError, SafeAuthErrorCode } from '../domain/types';

function buildMessageMap(errors: AppStrings['auth']['errors']): Record<SafeAuthErrorCode, string> {
  return {
    invalidCredentials: errors.invalidCredentials,
    networkUnavailable: errors.networkUnavailable,
    tooManyAttempts: errors.tooManyAttempts,
    accountInactive: errors.accountInactive,
    passwordChangeRequired: errors.passwordChangeRequired,
    roleMismatch: errors.roleMismatch,
    serviceUnavailable: errors.serviceUnavailable,
    accessRevoked: errors.accessRevoked,
    cancelled: errors.unknown,
    unknown: errors.unknown,
  };
}

export function mapSafeAuthError(
  error: SafeAuthError,
  errors: AppStrings['auth']['errors'] = en.auth.errors,
): string {
  const messageMap = buildMessageMap(errors);
  return messageMap[error.code] ?? messageMap.unknown;
}

export function toSafeAuthError(code: SafeAuthErrorCode): SafeAuthError {
  return { code, messageKey: code };
}
