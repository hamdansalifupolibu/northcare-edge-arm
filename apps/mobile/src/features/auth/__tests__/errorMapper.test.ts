import { en } from '../../../i18n/en';
import { mapSafeAuthError, toSafeAuthError } from '../services/errorMapper';

describe('auth error mapper', () => {
  it('maps invalid credentials without revealing account existence', () => {
    const message = mapSafeAuthError(toSafeAuthError('invalidCredentials'));
    expect(message).toBe(en.auth.errors.invalidCredentials);
    expect(message.toLowerCase()).not.toContain('email');
    expect(message.toLowerCase()).not.toContain('does not exist');
    expect(message.toLowerCase()).not.toContain('no user');
  });

  it('never surfaces provider-internal phrasing', () => {
    const message = mapSafeAuthError(toSafeAuthError('serviceUnavailable'));
    expect(message).not.toMatch(/firebase/i);
    expect(message).not.toMatch(/stack/i);
  });

  it('uses the same recovery-safe generic wording categories', () => {
    expect(mapSafeAuthError(toSafeAuthError('networkUnavailable'))).toBe(
      en.auth.errors.networkUnavailable,
    );
    expect(mapSafeAuthError(toSafeAuthError('roleMismatch'))).toBe(en.auth.errors.roleMismatch);
  });
});
