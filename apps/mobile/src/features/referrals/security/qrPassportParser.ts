import { REFERRAL_PASSPORT_URI_PREFIX } from '../domain/constants';
import { ReferralError } from '../domain/errors';
import {
  isSignedPassportUri,
  REFERRAL_PASSPORT_URI_PREFIX_V2,
  REFERRAL_PASSPORT_URI_PREFIX_V3,
} from './signedPassportCrypto';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export type ParsedReferralPassportQr =
  | {
      readonly ok: true;
      readonly version: 1;
      readonly opaqueToken: string;
      readonly uri: string;
    }
  | {
      readonly ok: true;
      readonly version: 2 | 3;
      readonly uri: string;
    }
  | {
      readonly ok: false;
      readonly reason: 'empty' | 'unsupportedScheme' | 'malformed' | 'invalidToken';
    };

/**
 * Strict parser - rejects arbitrary URLs and non-passport northcare deep links.
 * Does not resolve or mutate referral status.
 * v1 = opaque local lookup token; v2/v3 = Ed25519 signed offline claims (v3 seals name).
 */
export function parseReferralPassportQr(raw: string): ParsedReferralPassportQr {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty' };
  }

  if (trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V3)) {
    const body = trimmed.slice(REFERRAL_PASSPORT_URI_PREFIX_V3.length);
    if (!body.includes('.') || body.startsWith('.') || body.endsWith('.')) {
      return { ok: false, reason: 'malformed' };
    }
    return { ok: true, version: 3, uri: trimmed };
  }

  if (trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V2) || isSignedPassportUri(trimmed)) {
    const body = trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V2)
      ? trimmed.slice(REFERRAL_PASSPORT_URI_PREFIX_V2.length)
      : trimmed.replace(/^northcare:\/\/referral-passport\/v2\//, '');
    if (!body.includes('.') || body.startsWith('.') || body.endsWith('.')) {
      return { ok: false, reason: 'malformed' };
    }
    return {
      ok: true,
      version: 2,
      uri: trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V2)
        ? trimmed
        : `${REFERRAL_PASSPORT_URI_PREFIX_V2}${body}`,
    };
  }

  if (!trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX)) {
    if (trimmed.startsWith('northcare://') || /^https?:\/\//i.test(trimmed)) {
      return { ok: false, reason: 'unsupportedScheme' };
    }
    return { ok: false, reason: 'malformed' };
  }
  const token = trimmed.slice(REFERRAL_PASSPORT_URI_PREFIX.length);
  if (!TOKEN_PATTERN.test(token) || token.includes('/') || token.includes('?')) {
    return { ok: false, reason: 'invalidToken' };
  }
  return {
    ok: true,
    version: 1,
    opaqueToken: token,
    uri: `${REFERRAL_PASSPORT_URI_PREFIX}${token}`,
  };
}

/** Opaque v1 token only — use verifySignedPassportUri for v2/v3. */
export function assertValidReferralPassportQr(raw: string): string {
  const parsed = parseReferralPassportQr(raw);
  if (!parsed.ok) {
    throw new ReferralError(
      'invalidQrPayload',
      'This code is not a recognised NorthCare AI referral passport.',
    );
  }
  if (parsed.version !== 1) {
    throw new ReferralError(
      'invalidQrPayload',
      'This QR is a signed passport — open Verify passport to check it offline.',
    );
  }
  return parsed.opaqueToken;
}

export function buildReferralPassportUri(opaqueToken: string): string {
  if (!TOKEN_PATTERN.test(opaqueToken)) {
    throw new ReferralError('invalidQrPayload', 'Invalid passport token format.');
  }
  return `${REFERRAL_PASSPORT_URI_PREFIX}${opaqueToken}`;
}
