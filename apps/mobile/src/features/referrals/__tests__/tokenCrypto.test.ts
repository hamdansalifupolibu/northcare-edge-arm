import { generateOpaquePassportToken, hashPassportToken } from '../security/tokenCrypto';

describe('passport token crypto', () => {
  it('generates URL-safe opaque tokens from secure random bytes', () => {
    const token = generateOpaquePassportToken(() =>
      Uint8Array.from({ length: 16 }, (_, i) => i + 1),
    );
    expect(token).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(token.includes('+')).toBe(false);
    expect(token.includes('/')).toBe(false);
  });

  it('hashes tokens deterministically without exposing raw token in hash equality checks', () => {
    const a = hashPassportToken('opaque-token-AAAA');
    const b = hashPassportToken('opaque-token-AAAA');
    const c = hashPassportToken('opaque-token-BBBB');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
