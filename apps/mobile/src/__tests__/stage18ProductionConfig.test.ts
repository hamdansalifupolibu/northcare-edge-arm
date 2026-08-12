import { parsePublicEnv } from '../config/env';
import { getAppConfig, resetAppConfigCache } from '../config/appConfig';
import { createRemoteAuthProvider } from '../features/auth/services/createRemoteAuthProvider';
import { createDevelopmentAuthProvider } from '../features/auth/services/DevelopmentAuthProvider';
import { resolveDeepLinkPath } from '../navigation/deepLinks';
import { evaluateRouteAccess } from '../navigation/routeAccess';

jest.mock('../config/appConfig', () => {
  const actual = jest.requireActual('../config/appConfig');
  return {
    ...actual,
    getAppConfig: jest.fn(() => actual.getAppConfig()),
  };
});

describe('Stage 18 production configuration gates', () => {
  afterEach(() => {
    resetAppConfigCache();
    jest.clearAllMocks();
  });

  it('rejects cleartext HTTP API URLs outside development', () => {
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_APP_ENV: 'staging',
        EXPO_PUBLIC_API_BASE_URL: 'http://example.com',
      }),
    ).toThrow(/Cleartext HTTP/);
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_APP_ENV: 'production',
        EXPO_PUBLIC_API_BASE_URL: 'http://example.com',
      }),
    ).toThrow(/HTTPS/);
  });

  it('accepts HTTPS in production configuration parsing', () => {
    const env = parsePublicEnv({
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com',
    });
    expect(env.appEnv).toBe('production');
    expect(env.apiBaseUrl).toBe('https://api.example.com');
  });

  it('blocks development auth provider construction in production', () => {
    (getAppConfig as jest.Mock).mockReturnValue({
      ...jest.requireActual('../config/appConfig').getAppConfig(),
      appEnv: 'production',
    });
    expect(() => createDevelopmentAuthProvider()).toThrow(/cannot activate in production/);
    expect(createRemoteAuthProvider().id).toBe('unavailable');
  });

  it('blocks development routes when diagnostics are disabled', () => {
    expect(
      evaluateRouteAccess('development-only', { diagnosticsEnabled: false }).allowed,
    ).toBe(false);
  });

  it('fails closed for development and clinical deep links', () => {
    expect(resolveDeepLinkPath('/(development)/design-system').allowed).toBe(false);
    expect(resolveDeepLinkPath('/(admin)/accounts').allowed).toBe(false);
    expect(resolveDeepLinkPath('/(worker)/clients').allowed).toBe(false);
    expect(resolveDeepLinkPath('/unknown/path').redirectPath).toBe('/(entry)/splash');
  });
});
