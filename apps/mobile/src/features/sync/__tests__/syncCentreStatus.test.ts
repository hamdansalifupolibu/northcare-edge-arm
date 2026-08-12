import {
  categoriseSyncError,
  resolveSyncCentreMode,
  syncErrorCategoryMessage,
} from '../domain/syncStatus';

const messages = {
  errorConfiguration: 'config',
  errorAuthentication: 'auth',
  errorNetwork: 'network',
  errorServer: 'server',
  errorProtocol: 'protocol',
  errorUnknown: 'unknown',
};

describe('sync centre status', () => {
  it('maps configuration errors from transport messages', () => {
    expect(
      categoriseSyncError(new Error('Sync server is not configured for this build.')),
    ).toBe('configuration');
  });

  it('maps categories to user-facing copy', () => {
    expect(syncErrorCategoryMessage('network', messages)).toBe('network');
  });

  it('prefers unavailable state when sync server is not configured', () => {
    expect(
      resolveSyncCentreMode({
        syncing: false,
        syncConfigured: false,
        isOnline: true,
        checking: false,
        pending: 3,
      }),
    ).toBe('unavailable');
  });

  it('shows syncing while a retry is running', () => {
    expect(
      resolveSyncCentreMode({
        syncing: true,
        syncConfigured: true,
        isOnline: true,
        checking: false,
        pending: 0,
      }),
    ).toBe('syncing');
  });

  it('shows pending local changes instead of a failed-server hero state', () => {
    expect(
      resolveSyncCentreMode({
        syncing: false,
        syncConfigured: true,
        isOnline: true,
        checking: false,
        pending: 2,
      }),
    ).toBe('pending');
  });

  it('shows up to date when there are no pending local changes', () => {
    expect(
      resolveSyncCentreMode({
        syncing: false,
        syncConfigured: true,
        isOnline: true,
        checking: false,
        pending: 0,
      }),
    ).toBe('upToDate');
  });
});
