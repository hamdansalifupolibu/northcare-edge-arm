import { provisionalClientCodeFromId } from '../domain/clientReferenceCode';

describe('provisionalClientCodeFromId', () => {
  it('derives a stable NC-XXXXXX code from a UUID', () => {
    const id = 'abcdef12-3456-4789-8abc-def123456789';
    expect(provisionalClientCodeFromId(id)).toBe('NC-456789');
    expect(provisionalClientCodeFromId(id)).toBe('NC-456789');
  });
});
