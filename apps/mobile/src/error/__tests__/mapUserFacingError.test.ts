import { looksLikeSystemError, mapUserFacingError } from '../mapUserFacingError';

describe('mapUserFacingError', () => {
  it('hides system errors', () => {
    expect(
      mapUserFacingError(new Error("Property 't' doesn't exist"), 'Something went wrong.'),
    ).toBe('Something went wrong.');
    expect(mapUserFacingError(new Error('ReferenceError: x'), 'Fallback')).toBe('Fallback');
  });

  it('passes through friendly mapped messages', () => {
    expect(
      mapUserFacingError(
        new Error('The reminder could not be saved. Check the date and time.'),
        'Fallback',
      ),
    ).toBe('The reminder could not be saved. Check the date and time.');
  });

  it('detects system-like strings', () => {
    expect(looksLikeSystemError('HTTP 502')).toBe(true);
    expect(looksLikeSystemError('Please try again later.')).toBe(false);
  });

  it('hides repository operation failures', () => {
    expect(looksLikeSystemError('facility.listActive failed')).toBe(true);
  });
});
