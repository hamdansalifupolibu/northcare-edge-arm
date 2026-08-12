import {
  buildReferralPassportUri,
  parseReferralPassportQr,
} from '../security/qrPassportParser';

describe('referral passport QR parser', () => {
  it('accepts strict v1 passport URIs', () => {
    const token = 'AbCdEfGhIjKlMnOp';
    const parsed = parseReferralPassportQr(buildReferralPassportUri(token));
    expect(parsed).toEqual({
      ok: true,
      version: 1,
      opaqueToken: token,
      uri: `northcare://referral-passport/v1/${token}`,
    });
  });

  it('accepts signed v2 passport URIs', () => {
    const parsed = parseReferralPassportQr(
      'northcare://referral-passport/v2/eyJ2IjoyfQ.signaturepart',
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.version).toBe(2);
    }
  });

  it('accepts signed v3 sealed passport URIs', () => {
    const parsed = parseReferralPassportQr(
      'northcare://referral-passport/v3/eyJ2IjozfQ.signaturepart',
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.version).toBe(3);
    }
  });
});