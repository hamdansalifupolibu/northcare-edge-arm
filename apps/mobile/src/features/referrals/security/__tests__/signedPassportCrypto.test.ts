import {
  getFacilitySealPrivateKeyHex,
  getFacilitySealPublicKeyHex,
} from '../developmentFacilitySealKeys';
import {
  sealPatientPayload,
  tryUnsealPatientPayload,
} from '../facilityPassportSeal';
import {
  SIGNED_PASSPORT_SCHEMA_VERSION_V2,
  SIGNED_PASSPORT_SCHEMA_VERSION_V3,
  canonicalPassportClaimsJson,
  type SignedPassportClaimsV2,
  type SignedPassportClaimsV3,
} from '../signedPassportClaims';
import {
  REFERRAL_PASSPORT_URI_MAX_LENGTH,
  issueSealedSignedPassport,
  signPassportClaims,
  verifySignedPassportUri,
} from '../signedPassportCrypto';
import { REFERRAL_PASSPORT_DEV_KEY_ID } from '../developmentPassportKeys';
import { parseReferralPassportQr } from '../qrPassportParser';

/** Deterministic RNG for seal ciphertext stability in length tests. */
function sequentialRandom(seed = 7): (size: number) => Uint8Array {
  let n = seed;
  return (size: number) => {
    const out = new Uint8Array(size);
    for (let i = 0; i < size; i += 1) {
      n = (n * 1103515245 + 12345) & 0xffffffff;
      out[i] = (n >>> 16) & 0xff;
    }
    return out;
  };
}

function sampleV2(
  overrides: Partial<SignedPassportClaimsV2> = {},
): SignedPassportClaimsV2 {
  return {
    v: SIGNED_PASSPORT_SCHEMA_VERSION_V2,
    kid: REFERRAL_PASSPORT_DEV_KEY_ID,
    ref: 'NCR-DEMO-001',
    srcId: 'fac-dev-001',
    srcName: 'SYNTHETIC Northern Demo Clinic',
    dstId: 'GH-TTH',
    dstName: 'Tamale Teaching Hospital',
    reasonCode: 'danger_sign_review',
    reasonLabel: 'Needs facility review',
    priority: 'amber',
    createdAt: '2026-08-04T00:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
    issuerId: 'dev-worker-1',
    ...overrides,
  };
}

function sampleV3Base() {
  return {
    kid: REFERRAL_PASSPORT_DEV_KEY_ID,
    ref: 'NCR-DEMO-001',
    srcId: 'fac-dev-001',
    srcName: 'SYNTHETIC Northern Demo Clinic',
    dstId: 'GH-TTH',
    dstName: 'Tamale Teaching Hospital',
    reasonCode: 'danger_sign_review',
    reasonLabel: 'Needs facility review',
    priority: 'amber' as const,
    createdAt: '2026-08-04T00:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
    issuerId: 'dev-worker-1',
  };
}

describe('signed offline referral passport (Ed25519 + sealed name)', () => {
  it('issues v3 with sealed name unlockable only by destination facility', () => {
    const issued = issueSealedSignedPassport({
      base: sampleV3Base(),
      displayName: 'SYNTHETIC Ama Mensah',
      destinationFacilityKeyId: 'GH-TTH',
      sex: 'F',
      ageBand: '15-49y',
      randomBytes: sequentialRandom(11),
    });

    expect(issued.uri.startsWith('northcare://referral-passport/v3/')).toBe(true);
    expect(issued.uri.length).toBeLessThanOrEqual(REFERRAL_PASSPORT_URI_MAX_LENGTH);
    expect(issued.uri).not.toContain('Ama');
    expect(issued.uri).not.toContain('Mensah');
    expect(issued.claims.v).toBe(3);
    expect(issued.claims.sex).toBe('F');
    expect(issued.claims.ageBand).toBe('15-49y');

    const parsed = parseReferralPassportQr(issued.uri);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.version).toBe(3);
    }

    const asDestination = verifySignedPassportUri(issued.uri, {
      assignedFacilityKeyIds: ['GH-TTH'],
    });
    expect(asDestination.ok).toBe(true);
    if (asDestination.ok) {
      expect(asDestination.sealedPatient.status).toBe('unlocked');
      if (asDestination.sealedPatient.status === 'unlocked') {
        expect(asDestination.sealedPatient.displayName).toBe('SYNTHETIC Ama Mensah');
      }
    }

    const asOrigin = verifySignedPassportUri(issued.uri, {
      assignedFacilityKeyIds: ['fac-dev-001'],
    });
    expect(asOrigin.ok).toBe(true);
    if (asOrigin.ok) {
      expect(asOrigin.sealedPatient.status).toBe('sealedForDestination');
    }
  });

  it('rejects tampered sealed blob (signature fails)', () => {
    const issued = issueSealedSignedPassport({
      base: sampleV3Base(),
      displayName: 'SYNTHETIC Kwame Boateng',
      destinationFacilityKeyId: 'GH-TTH',
      randomBytes: sequentialRandom(21),
    });
    const body = issued.uri.replace('northcare://referral-passport/v3/', '');
    const [payload, sig] = body.split('.');
    const tamperedPayload =
      payload![0] === 'A' ? `B${payload!.slice(1)}` : `A${payload!.slice(1)}`;
    const tampered = `northcare://referral-passport/v3/${tamperedPayload}.${sig}`;
    const result = verifySignedPassportUri(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(['badSignature', 'malformed', 'invalidClaims']).toContain(result.reason);
    }
  });

  it('still verifies legacy v2 signature-only passports', () => {
    const { uri } = signPassportClaims(sampleV2());
    expect(uri.startsWith('northcare://referral-passport/v2/')).toBe(true);
    const result = verifySignedPassportUri(uri);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.v).toBe(2);
      expect(result.sealedPatient.status).toBe('notPresent');
      expect(result.claims.ref).toBe('NCR-DEMO-001');
    }
  });

  it('rejects expired passports', () => {
    const issued = issueSealedSignedPassport({
      base: {
        ...sampleV3Base(),
        expiresAt: '2020-01-01T00:00:00.000Z',
      },
      displayName: 'SYNTHETIC Expired Client',
      destinationFacilityKeyId: 'GH-TTH',
      randomBytes: sequentialRandom(31),
    });
    const result = verifySignedPassportUri(issued.uri, {
      nowMs: Date.parse('2026-08-04T00:00:00.000Z'),
      assignedFacilityKeyIds: ['GH-TTH'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('expired');
    }
  });

  it('canonical JSON is stable for v3 signing', () => {
    const sealed = sealPatientPayload(
      { displayName: 'SYNTHETIC Stable Name' },
      getFacilitySealPublicKeyHex('GH-TTH')!,
      sequentialRandom(41),
    );
    const claims: SignedPassportClaimsV3 = {
      ...sampleV3Base(),
      v: SIGNED_PASSPORT_SCHEMA_VERSION_V3,
      sealed,
      sex: 'U',
      ageBand: 'U',
    };
    expect(canonicalPassportClaimsJson(claims)).toBe(
      canonicalPassportClaimsJson(claims),
    );
    expect(canonicalPassportClaimsJson(claims).startsWith('{"v":3,')).toBe(true);
  });

  it('does not embed phone or clinical notes in claims JSON', () => {
    const issued = issueSealedSignedPassport({
      base: sampleV3Base(),
      displayName: 'SYNTHETIC Privacy Person',
      destinationFacilityKeyId: 'GH-KBTH',
      randomBytes: sequentialRandom(51),
    });
    const json = canonicalPassportClaimsJson(issued.claims);
    expect(json.toLowerCase()).not.toContain('phone');
    expect(json.toLowerCase()).not.toContain('dosage');
    expect(json.toLowerCase()).not.toContain('prescription');
  });

  it('hard-fails when URI would exceed scannability limit', () => {
    const longLabel = 'X'.repeat(900);
    expect(() =>
      issueSealedSignedPassport({
        base: {
          ...sampleV3Base(),
          reasonLabel: longLabel,
          srcName: longLabel,
          dstName: longLabel,
        },
        displayName: 'SYNTHETIC Too Long',
        destinationFacilityKeyId: 'GH-TTH',
        randomBytes: sequentialRandom(61),
      }),
    ).toThrow('uri_too_long');
  });

  it('seal open fails with wrong facility private key', () => {
    const sealed = sealPatientPayload(
      { displayName: 'SYNTHETIC Sealed Only' },
      getFacilitySealPublicKeyHex('GH-TTH')!,
      sequentialRandom(71),
    );
    expect(
      tryUnsealPatientPayload(sealed, getFacilitySealPrivateKeyHex('GH-KBTH')!),
    ).toBeNull();
    expect(
      tryUnsealPatientPayload(sealed, getFacilitySealPrivateKeyHex('GH-TTH')!)
        ?.displayName,
    ).toBe('SYNTHETIC Sealed Only');
  });
});
