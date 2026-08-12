export type PinValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'length' | 'nonNumeric' | 'mismatch' };

export function validatePinFormat(pin: string): PinValidationResult {
  if (!/^\d{6}$/.test(pin)) {
    if (pin.length !== 6) {
      return { ok: false, reason: 'length' };
    }
    return { ok: false, reason: 'nonNumeric' };
  }
  return { ok: true };
}

export function validatePinConfirmation(pin: string, confirmation: string): PinValidationResult {
  const format = validatePinFormat(pin);
  if (!format.ok) {
    return format;
  }
  if (pin !== confirmation) {
    return { ok: false, reason: 'mismatch' };
  }
  return { ok: true };
}
