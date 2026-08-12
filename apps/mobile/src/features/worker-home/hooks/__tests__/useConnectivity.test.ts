import type { NetInfoState } from '@react-native-community/netinfo';

import { resolveConnectivityOnline } from '../useConnectivity';

describe('resolveConnectivityOnline', () => {
  function state(partial: Partial<NetInfoState>): NetInfoState {
    return {
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: null,
      isWifiEnabled: true,
      ...partial,
    } as NetInfoState;
  }

  it('treats disconnected states as offline', () => {
    expect(resolveConnectivityOnline(state({ isConnected: false, type: 'none' }))).toBe(false);
    expect(resolveConnectivityOnline(state({ isInternetReachable: false }))).toBe(false);
  });

  it('treats reachable wifi as online', () => {
    expect(
      resolveConnectivityOnline(
        state({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
      ),
    ).toBe(true);
  });

  it('treats wifi with null reachability as online', () => {
    expect(
      resolveConnectivityOnline(
        state({ isConnected: true, isInternetReachable: null, type: 'wifi' }),
      ),
    ).toBe(true);
  });
});
