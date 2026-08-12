import { createLogger, sanitizeMeta } from '../../logging/logger';
import { isEntityId } from '../domain/value-objects/EntityId';
import { createIdGenerator } from '../domain/value-objects/idGenerator';
import { assertDateOnly, isDateOnly } from '../domain/value-objects/dateOnly';
import { isIsoUtcTimestamp } from '../domain/value-objects/timestamps';
import { normalizeSearchText } from '../domain/validation/normalizeSearch';

describe('domain helpers and privacy', () => {
  it('generates unique UUID v4 identifiers', () => {
    const ids = createIdGenerator(() => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return bytes;
    });
    const values = new Set(Array.from({ length: 50 }, () => ids.nextId()));
    expect(values.size).toBe(50);
    for (const id of values) {
      expect(isEntityId(id)).toBe(true);
    }
  });

  it('validates UTC timestamps and date-only values', () => {
    expect(isIsoUtcTimestamp('2026-08-02T12:30:00.000Z')).toBe(true);
    expect(isIsoUtcTimestamp('02/08/2026')).toBe(false);
    expect(isDateOnly('2026-08-02')).toBe(true);
    expect(isDateOnly('2026-13-40')).toBe(false);
    expect(assertDateOnly('1998-04-12')).toBe('1998-04-12');
  });

  it('normalises search text without stripping letters', () => {
    expect(normalizeSearchText('  Ama   Synthetic ')).toBe('ama synthetic');
  });

  it('redacts health-related log metadata keys', () => {
    const meta = sanitizeMeta({
      operation: 'client.create',
      phone: '+233000000001',
      health: 'should not appear',
      table: 'clients',
    });
    expect(meta?.phone).toBe('[REDACTED]');
    expect(meta?.health).toBe('[REDACTED]');
    expect(meta?.operation).toBe('client.create');

    const lines: string[] = [];
    const logger = createLogger({
      environment: 'development',
      sink: (_level, message, m) => {
        lines.push(`${message} ${JSON.stringify(m)}`);
      },
    });
    logger.info('repo op', { screeningAnswer: 'fever', category: 'validation' });
    expect(lines.join(' ')).not.toContain('fever');
    expect(lines.join(' ')).toContain('[REDACTED]');
  });
});
