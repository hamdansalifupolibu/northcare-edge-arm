import type { SignedActivationClaimsV1 } from '../security/signedActivationClaims';

let pendingClaims: SignedActivationClaimsV1 | null = null;

export function setPendingActivationClaims(claims: SignedActivationClaimsV1): void {
  pendingClaims = claims;
}

export function getPendingActivationClaims(): SignedActivationClaimsV1 | null {
  return pendingClaims;
}

export function clearPendingActivationClaims(): void {
  pendingClaims = null;
}
