import {
  DEVELOPMENT_OFFLINE_ACCESS_POLICY,
  isOfflineEntitlementValid,
} from '../domain/offlinePolicy';

describe('offline access policy', () => {
  it('uses labelled development-provisional values', () => {
    expect(DEVELOPMENT_OFFLINE_ACCESS_POLICY.label).toBe('development-provisional');
    expect(DEVELOPMENT_OFFLINE_ACCESS_POLICY.maxFailedPinAttempts).toBe(5);
  });

  it('accepts entitlement within the max window', () => {
    const now = Date.parse('2026-08-02T12:00:00.000Z');
    const last = new Date(now - 1000 * 60 * 60).toISOString();
    expect(isOfflineEntitlementValid(last, now)).toBe(true);
  });

  it('rejects expired offline entitlement', () => {
    const now = Date.parse('2026-08-02T12:00:00.000Z');
    const last = new Date(
      now - DEVELOPMENT_OFFLINE_ACCESS_POLICY.maxMsSinceRemoteVerification - 1,
    ).toISOString();
    expect(isOfflineEntitlementValid(last, now)).toBe(false);
  });

  it('rejects invalid verification timestamps', () => {
    expect(isOfflineEntitlementValid('not-a-date', Date.now())).toBe(false);
  });
});
