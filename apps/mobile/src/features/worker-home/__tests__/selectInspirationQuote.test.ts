import { getInspirationBucket, selectInspirationQuote } from '../domain/selectInspirationQuote';

describe('selectInspirationQuote', () => {
  it('maps hours to inspiration buckets', () => {
    expect(getInspirationBucket(new Date('2026-08-08T08:30:00'))).toBe('morning');
    expect(getInspirationBucket(new Date('2026-08-08T14:00:00'))).toBe('afternoon');
    expect(getInspirationBucket(new Date('2026-08-08T19:00:00'))).toBe('evening');
    expect(getInspirationBucket(new Date('2026-08-08T23:00:00'))).toBe('night');
  });

  it('returns a quote from the active bucket', () => {
    const quote = selectInspirationQuote({
      now: new Date('2026-08-08T09:15:00'),
    });
    expect(quote.id.startsWith('m')).toBe(true);
    expect(quote.text.length).toBeGreaterThan(10);
  });

  it('avoids repeating the previous quote when another exists', () => {
    const now = new Date('2026-08-08T09:15:00');
    const first = selectInspirationQuote({ now });
    const second = selectInspirationQuote({ now, lastQuoteId: first.id });
    expect(second.id).not.toBe(first.id);
  });
});
