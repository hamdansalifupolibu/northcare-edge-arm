import { createLogger, sanitizeMeta } from '../logging/logger';

describe('sanitizeMeta', () => {
  it('redacts sensitive keys', () => {
    const result = sanitizeMeta({
      token: 'abc123',
      password: 'secret',
      patientName: 'Amina',
      diagnosis: 'example',
      requestId: 'req-1',
    });

    expect(result).toEqual({
      token: '[REDACTED]',
      password: '[REDACTED]',
      patientName: '[REDACTED]',
      diagnosis: '[REDACTED]',
      requestId: 'req-1',
    });
  });

  it('does not blindly serialise arrays or complex objects', () => {
    const result = sanitizeMeta({
      items: [1, 2, 3],
      nested: { ok: true, apiKey: 'x' },
    });

    expect(result).toEqual({
      items: '[array:3]',
      nested: { ok: true, apiKey: '[REDACTED]' },
    });
  });
});

describe('createLogger', () => {
  it('writes sanitised metadata through the sink', () => {
    const calls: { level: string; message: string; meta?: unknown }[] = [];
    const logger = createLogger({
      environment: 'development',
      sink: (level, message, meta) => {
        calls.push({ level, message, meta });
      },
    });

    logger.info('foundation ready', { authToken: 'should-hide', build: '0.1.0' });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.meta).toEqual({
      authToken: '[REDACTED]',
      build: '0.1.0',
    });
  });

  it('suppresses debug logs outside development', () => {
    const calls: string[] = [];
    const logger = createLogger({
      environment: 'production',
      sink: (_level, message) => {
        calls.push(message);
      },
    });

    logger.debug('should not appear');
    logger.error('should appear');

    expect(calls).toEqual(['should appear']);
  });
});
