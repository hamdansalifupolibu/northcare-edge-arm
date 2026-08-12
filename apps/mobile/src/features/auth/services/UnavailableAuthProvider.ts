import type { RemoteAuthProvider, SignInResult } from './RemoteAuthProvider';

/**
 * Production fail-closed provider when Firebase/remote config is unavailable.
 */
export function createUnavailableAuthProvider(): RemoteAuthProvider {
  const unavailable = (): SignInResult => ({
    ok: false,
    error: { code: 'serviceUnavailable', messageKey: 'serviceUnavailable' },
  });

  return {
    id: 'unavailable',
    async signIn() {
      return unavailable();
    },
    async signOut() {
      return;
    },
    async changePassword() {
      return unavailable();
    },
    async requestPasswordReset() {
      return { ok: true, genericMessageKey: 'recoverySubmitted' };
    },
    async getCurrentAccount() {
      return null;
    },
    async refreshAccountStatus() {
      return unavailable();
    },
    getPasswordPolicy: () => ({
      minLength: 8,
      requireMixedCase: true,
      requireDigit: true,
    }),
  };
}
