import { parsePublicEnv } from '../config/env';

describe('parsePublicEnv', () => {
  it('defaults to development when unset', () => {
    const env = parsePublicEnv({
      EXPO_PUBLIC_APP_ENV: undefined,
      EXPO_PUBLIC_API_BASE_URL: undefined,
    });
    expect(env.appEnv).toBe('development');
    expect(env.apiBaseUrl).toBe('');
  });

  it('accepts valid environments', () => {
    expect(
      parsePublicEnv({
        EXPO_PUBLIC_APP_ENV: 'staging',
        EXPO_PUBLIC_API_BASE_URL: '',
      }).appEnv,
    ).toBe('staging');
  });

  it('rejects malformed environments', () => {
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_APP_ENV: 'local',
        EXPO_PUBLIC_API_BASE_URL: '',
      }),
    ).toThrow(/Invalid EXPO_PUBLIC_APP_ENV/);
  });

  it('rejects malformed API base URLs', () => {
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_APP_ENV: 'development',
        EXPO_PUBLIC_API_BASE_URL: 'not-a-url',
      }),
    ).toThrow(/Invalid EXPO_PUBLIC_API_BASE_URL/);
  });

  it('accepts a valid absolute API base URL', () => {
    const env = parsePublicEnv({
      EXPO_PUBLIC_APP_ENV: 'development',
      EXPO_PUBLIC_API_BASE_URL: 'https://example.com/api',
    });
    expect(env.apiBaseUrl).toBe('https://example.com/api');
  });
});
