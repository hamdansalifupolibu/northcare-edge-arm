import { getAppConfig, resetAppConfigCache } from '../../../config/appConfig';
import { createRemoteAuthProvider } from '../services/createRemoteAuthProvider';

jest.mock('../../../config/appConfig', () => {
  const actual = jest.requireActual('../../../config/appConfig');
  return {
    ...actual,
    getAppConfig: jest.fn(() => actual.getAppConfig()),
  };
});

describe('createRemoteAuthProvider factory', () => {
  afterEach(() => {
    resetAppConfigCache();
    jest.clearAllMocks();
  });

  it('selects development provider outside production/staging', () => {
    (getAppConfig as jest.Mock).mockReturnValue({
      ...jest.requireActual('../../../config/appConfig').getAppConfig(),
      appEnv: 'development',
    });
    expect(createRemoteAuthProvider().id).toBe('development');
  });

  it('fails closed with unavailable provider in production', () => {
    (getAppConfig as jest.Mock).mockReturnValue({
      ...jest.requireActual('../../../config/appConfig').getAppConfig(),
      appEnv: 'production',
    });
    expect(createRemoteAuthProvider().id).toBe('unavailable');
  });

  it('fails closed with unavailable provider in staging', () => {
    (getAppConfig as jest.Mock).mockReturnValue({
      ...jest.requireActual('../../../config/appConfig').getAppConfig(),
      appEnv: 'staging',
    });
    expect(createRemoteAuthProvider().id).toBe('unavailable');
  });
});
