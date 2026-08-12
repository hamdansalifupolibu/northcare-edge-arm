/**
 * Development-only Ed25519 key material for offline-verifiable referral passports.
 *
 * IMPORTANT:
 * - Embedded private key is acceptable ONLY for hackathon / development builds.
 * - Rotate and move signing to a secured issuer before any pilot or production.
 * - Verification uses the public key on every NorthCare build so Worker 2 does
 *   not need the origin device database.
 */

export const REFERRAL_PASSPORT_SIGNING_ALGORITHM = 'Ed25519' as const;

/** Stable key id embedded in signed packages for future key rotation. */
export const REFERRAL_PASSPORT_DEV_KEY_ID = 'dev-hackathon-2026-ed25519';

/**
 * 32-byte Ed25519 private seed (hex). DEVELOPMENT / DEMO ONLY.
 * Generated once for NorthCare Reach demo; not a production secret.
 */
export const REFERRAL_PASSPORT_DEV_PRIVATE_KEY_HEX =
  'ed9cb7945c83e6af2aecda8c160cbaa96fb1a13b18fe7bbd808d12e8c30386fe';

/** Matching 32-byte Ed25519 public key (hex). */
export const REFERRAL_PASSPORT_DEV_PUBLIC_KEY_HEX =
  '16d9145dfdf2cce9e354edd4501a43d22181d04155c085df47d9497cc3fe4e51';
