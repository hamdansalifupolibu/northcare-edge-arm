import {
  createPinVerifierWithSalt,
  DEFAULT_SCRYPT_PARAMS,
  PIN_KDF_VERSION,
  verifyPin,
} from '../crypto/pinVerifier';
import { validatePinConfirmation, validatePinFormat } from '../validation/pinValidation';

describe('PIN validation', () => {
  it('accepts exactly six digits', () => {
    expect(validatePinFormat('123456').ok).toBe(true);
    expect(validatePinFormat('12345').ok).toBe(false);
    expect(validatePinFormat('12345a').ok).toBe(false);
  });

  it('requires confirmation match', () => {
    expect(validatePinConfirmation('123456', '123456').ok).toBe(true);
    expect(validatePinConfirmation('123456', '654321').ok).toBe(false);
  });
});

describe('PIN verifier (scrypt)', () => {
  const saltA = '00112233445566778899aabbccddeeff';
  const saltB = 'ffeeddccbbaa99887766554433221100';

  it('verifies the correct PIN and rejects incorrect PIN', () => {
    const record = createPinVerifierWithSalt('246810', saltA);
    expect(record.version).toBe(PIN_KDF_VERSION);
    expect(record.N).toBe(DEFAULT_SCRYPT_PARAMS.N);
    expect(verifyPin('246810', record)).toBe(true);
    expect(verifyPin('000000', record)).toBe(false);
  });

  it('produces different verifiers for different salts', () => {
    const a = createPinVerifierWithSalt('246810', saltA);
    const b = createPinVerifierWithSalt('246810', saltB);
    expect(a.verifierHex).not.toBe(b.verifierHex);
  });

  it('never stores the raw PIN on the record', () => {
    const record = createPinVerifierWithSalt('135790', saltA);
    expect(JSON.stringify(record)).not.toContain('135790');
  });

  it('rejects verifiers with unexpected version or kdf', () => {
    const record = createPinVerifierWithSalt('246810', saltA);
    expect(verifyPin('246810', { ...record, version: 99 as 1 })).toBe(false);
    expect(verifyPin('246810', { ...record, kdf: 'pbkdf2' as 'scrypt' })).toBe(false);
  });
});
