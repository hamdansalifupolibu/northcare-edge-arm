/**
 * Development-only Ed25519 keys for offline worker activation QR.
 * Reuses referral passport key material with a distinct key id for audit clarity.
 */

export const WORKER_ACTIVATION_SIGNING_ALGORITHM = 'Ed25519' as const;

export const WORKER_ACTIVATION_DEV_KEY_ID = 'dev-worker-activation-2026-ed25519';

export {
  REFERRAL_PASSPORT_DEV_PRIVATE_KEY_HEX as WORKER_ACTIVATION_DEV_PRIVATE_KEY_HEX,
  REFERRAL_PASSPORT_DEV_PUBLIC_KEY_HEX as WORKER_ACTIVATION_DEV_PUBLIC_KEY_HEX,
} from '../../referrals/security/developmentPassportKeys';
