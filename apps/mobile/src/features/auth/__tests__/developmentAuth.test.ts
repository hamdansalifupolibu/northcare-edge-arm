import { getAppConfig } from '../../../config/appConfig';
import { createDevelopmentAuthProvider } from '../services/DevelopmentAuthProvider';
import { createUnavailableAuthProvider } from '../services/UnavailableAuthProvider';

jest.mock('../../../config/appConfig', () => {
  const actual = jest.requireActual('../../../config/appConfig');
  return {
    ...actual,
    getAppConfig: jest.fn(() => ({
      ...actual.getAppConfig(),
      appEnv: 'development',
    })),
  };
});

describe('DevelopmentAuthProvider', () => {
  beforeEach(() => {
    (getAppConfig as jest.Mock).mockReturnValue({
      ...jest.requireActual('../../../config/appConfig').getAppConfig(),
      appEnv: 'development',
    });
  });

  it('signs in a synthetic worker', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'dev-worker-001',
      password: 'WorkerDemo1!',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.account.role).toBe('worker');
      expect(JSON.stringify(result.account)).not.toMatch(/WorkerDemo1!/);
    }
  });

  it('returns generic invalid credentials for wrong password', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'dev-worker-001',
      password: 'wrong',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalidCredentials');
    }
  });

  it('detects role mismatch', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'dev-admin-001',
      password: 'AdminDemo1!',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('roleMismatch');
    }
  });

  it('requires password change for temp account', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'dev-worker-temp',
      password: 'TempPass1!',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('passwordChangeRequired');
      expect(result.account?.accountId).toBe('dev-worker-temp');
    }
  });

  it('reports network unavailable when simulated', async () => {
    const provider = createDevelopmentAuthProvider({ simulateNetworkUnavailable: true });
    const result = await provider.signIn({
      loginIdentifier: 'dev-worker-001',
      password: 'WorkerDemo1!',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('networkUnavailable');
    }
  });

  it('password reset does not reveal account existence', async () => {
    const provider = createDevelopmentAuthProvider();
    const known = await provider.requestPasswordReset('dev-worker-001');
    const unknown = await provider.requestPasswordReset('no-such-user');
    expect(known.genericMessageKey).toBe('recoverySubmitted');
    expect(unknown.genericMessageKey).toBe('recoverySubmitted');
  });

  it('rejects inactive accounts', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'dev-worker-inactive',
      password: 'Inactive1!',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('accountInactive');
    }
  });

  it('signs in a synthetic administrator', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'dev-admin-001',
      password: 'AdminDemo1!',
      expectedRole: 'administrator',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.account.role).toBe('administrator');
    }
  });

  it('signs in the canonical dual-role development email locally', async () => {
    const provider = createDevelopmentAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'hamdansalifupolibu@gmail.com',
      password: 'Mama0599545544@',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.account.accountId).toBe('dev-dual-8d2ce4bbb8e656c8afea');
      expect(result.account.permittedWorkspaces).toEqual(['worker', 'administration']);
    }
  });

  it('accepts Hamdan sync password and Salma/Takiya passwords offline', async () => {
    const provider = createDevelopmentAuthProvider();
    const hamdanSync = await provider.signIn({
      loginIdentifier: 'hamdansalifupolibu@gmail.com',
      password: 'NorthCareDemo1!',
      expectedRole: 'administrator',
    });
    expect(hamdanSync.ok).toBe(true);

    const hammyDanny = await provider.signIn({
      loginIdentifier: 'hammydanny@gmail.com',
      password: 'Mama0599545544@',
      expectedRole: 'administrator',
    });
    expect(hammyDanny.ok).toBe(true);
    if (hammyDanny.ok) {
      expect(hammyDanny.account.role).toBe('administrator');
      expect(hammyDanny.account.permittedWorkspaces).toContain('administration');
    }

    const salma = await provider.signIn({
      loginIdentifier: '  salmaabukari4@gmail.com  ',
      password: ' NorthCare@123 ',
      expectedRole: 'worker',
    });
    expect(salma.ok).toBe(true);

    const takiya = await provider.signIn({
      loginIdentifier: 'ibrahimtakiya06@gmail.com',
      password: 'NorthCare@123',
      expectedRole: 'administrator',
    });
    expect(takiya.ok).toBe(true);
  });

  it('cannot activate when demo local auth is disabled', () => {
    const previous = process.env.EXPO_PUBLIC_DEMO_LOCAL_AUTH;
    process.env.EXPO_PUBLIC_DEMO_LOCAL_AUTH = 'false';
    (getAppConfig as jest.Mock).mockReturnValue({
      ...jest.requireActual('../../../config/appConfig').getAppConfig(),
      appEnv: 'production',
    });
    expect(() => createDevelopmentAuthProvider()).toThrow(/demo local auth/i);
    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_DEMO_LOCAL_AUTH;
    } else {
      process.env.EXPO_PUBLIC_DEMO_LOCAL_AUTH = previous;
    }
  });
});

describe('UnavailableAuthProvider', () => {
  it('fails closed', async () => {
    const provider = createUnavailableAuthProvider();
    const result = await provider.signIn({
      loginIdentifier: 'x',
      password: 'y',
      expectedRole: 'worker',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('serviceUnavailable');
    }
  });
});
