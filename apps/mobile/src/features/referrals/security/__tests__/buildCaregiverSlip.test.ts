import {
  buildCaregiverSlipData,
  buildCaregiverSlipHtml,
  buildCaregiverSlipText,
  CAREGIVER_SLIP_FALLBACK_CLIENT_NAME,
} from '../buildCaregiverSlip';
import {
  canonicalPassportClaimsJson,
  SIGNED_PASSPORT_SCHEMA_VERSION_V2,
  type SignedPassportClaimsV2,
} from '../signedPassportClaims';
import { signPassportClaims } from '../signedPassportCrypto';
import { REFERRAL_PASSPORT_DEV_KEY_ID } from '../developmentPassportKeys';

function sampleClaims(
  overrides: Partial<SignedPassportClaimsV2> = {},
): SignedPassportClaimsV2 {
  return {
    v: SIGNED_PASSPORT_SCHEMA_VERSION_V2,
    kid: REFERRAL_PASSPORT_DEV_KEY_ID,
    ref: 'NCR-DEMO-001',
    srcId: 'fac-src',
    srcName: 'SYNTHETIC Northern Demo Clinic',
    dstId: 'fac-tth',
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

describe('caregiver slip builders', () => {
  const uri =
    'northcare://referral-passport/v2/eyJ2IjoyfQ.signature-placeholder';

  it('includes allowed paper fields and client display name', () => {
    const slip = buildCaregiverSlipData({
      claims: sampleClaims(),
      uri,
      clientDisplayName: 'SYNTHETIC Ama Mensah',
    });
    expect(slip.clientDisplayName).toBe('SYNTHETIC Ama Mensah');
    expect(slip.referenceCode).toBe('NCR-DEMO-001');
    expect(slip.sourceFacilityName).toContain('Demo Clinic');
    expect(slip.destinationFacilityName).toBe('Tamale Teaching Hospital');
    expect(slip.reasonLabel).toBe('Needs facility review');
    expect(slip.priorityLabel).toBe('amber');
    expect(slip.passportUri).toBe(uri);
    expect(slip.receivingFacilityInstruction.toLowerCase()).toContain('receiving facility');
    expect(slip.privacyLine.toLowerCase()).toContain('qr');
  });

  it('falls back when client name is missing', () => {
    const slip = buildCaregiverSlipData({
      claims: sampleClaims(),
      uri,
      clientDisplayName: '   ',
    });
    expect(slip.clientDisplayName).toBe(CAREGIVER_SLIP_FALLBACK_CLIENT_NAME);
  });

  it('text and HTML include allowed fields and exclude phone/notes', () => {
    const text = buildCaregiverSlipText({
      claims: sampleClaims(),
      uri,
      clientDisplayName: 'SYNTHETIC Kwame Boateng',
    });
    const html = buildCaregiverSlipHtml({
      claims: sampleClaims(),
      uri,
      clientDisplayName: 'SYNTHETIC Kwame Boateng',
      qrSvgMarkup: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      logoDataUrl: null,
    });

    for (const content of [text, html]) {
      expect(content).toContain('SYNTHETIC Kwame Boateng');
      expect(content).toContain('NCR-DEMO-001');
      expect(content).toContain('Tamale Teaching Hospital');
      expect(content).toContain('Needs facility review');
      expect(content.toLowerCase()).not.toContain('worker notes');
      expect(content.toLowerCase()).not.toContain('communicationnotes');
      expect(content.toLowerCase()).not.toContain('phone');
      expect(content.toLowerCase()).not.toContain('dosage');
      expect(content.toLowerCase()).not.toContain('+233');
    }

    expect(html).toContain('<svg');
    expect(html).toContain('NorthCare AI');
  });

  it('does not put full name into QR/claims builders', () => {
    const claims = sampleClaims();
    const { uri: signedUri } = signPassportClaims(claims);
    const json = canonicalPassportClaimsJson(claims);
    const fullName = 'SYNTHETIC Ama Mensah';

    expect(json).not.toContain(fullName);
    expect(json.toLowerCase()).not.toContain('givenname');
    expect(signedUri).not.toContain(encodeURIComponent(fullName));
    expect(signedUri).not.toContain(fullName);

    const slip = buildCaregiverSlipData({
      claims,
      uri: signedUri,
      clientDisplayName: fullName,
    });
    // Paper may include name; QR payload URI remains name-free.
    expect(slip.clientDisplayName).toBe(fullName);
    expect(slip.passportUri).toBe(signedUri);
    expect(slip.passportUri).not.toContain(fullName);
  });
});
