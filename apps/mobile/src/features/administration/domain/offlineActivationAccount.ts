import type { AuthAccount } from '../../auth/domain/types';
import type { SignedActivationClaimsV1 } from '../security/signedActivationClaims';

export function authAccountFromActivationClaims(
  claims: SignedActivationClaimsV1,
  nowIso: string = new Date().toISOString(),
): AuthAccount {
  return {
    accountId: claims.enrollmentId,
    displayName: claims.displayName,
    role: 'worker',
    availableRoles: ['worker'],
    permittedWorkspaces: ['worker'],
    facilityId: claims.facilityId,
    facilityName: claims.facilityName,
    facilityType: undefined,
    districtOrRegion: undefined,
    organisationId: claims.organisationId,
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: nowIso,
    offlineAccessPolicyVersion: 1,
  };
}
