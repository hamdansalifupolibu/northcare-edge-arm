import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type ConnectivityState = {
  readonly isOnline: boolean;
  readonly checking: boolean;
};

const REACHABILITY_PROBE_MS = 2_500;

function hasActiveLink(state: NetInfoState): boolean {
  if (state.isConnected === false || state.type === 'none' || state.type === 'unknown') {
    return false;
  }
  return state.isConnected === true;
}

export function resolveConnectivityOnline(state: NetInfoState): boolean {
  if (!hasActiveLink(state)) {
    return false;
  }
  if (state.isInternetReachable === false) {
    return false;
  }
  if (state.isInternetReachable === true) {
    return true;
  }
  // Android often leaves isInternetReachable null while Wi‑Fi/cellular is up.
  return state.type === 'wifi' || state.type === 'cellular' || state.type === 'ethernet';
}

function needsReachabilityProbe(state: NetInfoState): boolean {
  return hasActiveLink(state) && state.isInternetReachable == null;
}

export function useConnectivity(): ConnectivityState {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  const applyState = useCallback((state: NetInfoState) => {
    setIsOnline(resolveConnectivityOnline(state));
    setChecking(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    let probeTimer: ReturnType<typeof setTimeout> | undefined;

    const handleState = (state: NetInfoState): void => {
      if (!mounted) {
        return;
      }
      if (needsReachabilityProbe(state)) {
        setChecking(true);
        clearTimeout(probeTimer);
        probeTimer = setTimeout(() => {
          if (!mounted) {
            return;
          }
          void NetInfo.refresh().then((refreshed) => {
            if (!mounted) {
              return;
            }
            applyState(refreshed);
          });
        }, REACHABILITY_PROBE_MS);
        return;
      }
      clearTimeout(probeTimer);
      applyState(state);
    };

    void NetInfo.fetch().then(handleState);
    const unsubscribe = NetInfo.addEventListener(handleState);

    const onAppStateChange = (next: AppStateStatus): void => {
      if (next !== 'active') {
        return;
      }
      setChecking(true);
      void NetInfo.refresh().then(handleState);
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      mounted = false;
      clearTimeout(probeTimer);
      unsubscribe();
      appStateSub.remove();
    };
  }, [applyState]);

  return { isOnline, checking };
}
