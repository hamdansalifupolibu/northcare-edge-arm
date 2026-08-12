/**
 * Provisional offline-access policy (development values).
 * Production durations require explicit security approval.
 */
export type OfflineAccessPolicy = {
  readonly version: number;
  readonly offlineUnlockAllowed: boolean;
  readonly maxMsSinceRemoteVerification: number;
  readonly maxFailedPinAttempts: number;
  readonly temporaryLockoutMs: number;
  readonly biometricsPermitted: boolean;
  readonly administratorOfflineUnlockAllowed: boolean;
  readonly sessionInactivityTimeoutMs: number;
  readonly label: 'development-provisional' | 'production-pending-approval';
};

export const DEVELOPMENT_OFFLINE_ACCESS_POLICY: OfflineAccessPolicy = {
  version: 1,
  offlineUnlockAllowed: true,
  maxMsSinceRemoteVerification: 1000 * 60 * 60 * 24 * 14, // 14 days provisional
  maxFailedPinAttempts: 5,
  temporaryLockoutMs: 1000 * 30, // 30s provisional for demo usability
  biometricsPermitted: true,
  administratorOfflineUnlockAllowed: true,
  sessionInactivityTimeoutMs: 1000 * 60 * 15, // 15 minutes provisional
  label: 'development-provisional',
};

export function isOfflineEntitlementValid(
  lastRemoteVerificationAt: string,
  nowMs: number,
  policy: OfflineAccessPolicy = DEVELOPMENT_OFFLINE_ACCESS_POLICY,
): boolean {
  if (!policy.offlineUnlockAllowed) {
    return false;
  }
  const last = Date.parse(lastRemoteVerificationAt);
  if (!Number.isFinite(last)) {
    return false;
  }
  return nowMs - last <= policy.maxMsSinceRemoteVerification;
}
