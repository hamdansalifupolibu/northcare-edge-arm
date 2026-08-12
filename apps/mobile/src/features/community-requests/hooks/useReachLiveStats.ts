import { useCallback, useEffect, useRef, useState } from 'react';

import type { CommunityRequestListFilter } from '../domain/types';
import { useCommunityRequestServices } from './useCommunityRequestServices';

export type ReachLiveStats = {
  readonly awaiting: number | null;
  readonly assignedToMe: number | null;
  readonly emergency: number | null;
  readonly loading: boolean;
};

const EMPTY: ReachLiveStats = {
  awaiting: null,
  assignedToMe: null,
  emergency: null,
  loading: true,
};

const STAT_FILTERS: readonly CommunityRequestListFilter[] = [
  'awaiting',
  'assignedToMe',
  'emergency',
];

export function useReachLiveStats(enabled: boolean): ReachLiveStats & { readonly refresh: () => void } {
  const services = useCommunityRequestServices();
  const servicesRef = useRef(services);
  servicesRef.current = services;
  const [stats, setStats] = useState<ReachLiveStats>(EMPTY);
  const inFlightRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refresh = useCallback(() => {
    if (!enabledRef.current || inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    void Promise.all(
      STAT_FILTERS.map(async (filter) => {
        try {
          const response = await servicesRef.current.listCommunityRequests(filter);
          return response.items.length;
        } catch {
          return null;
        }
      }),
    )
      .then((results) => {
        if (!enabledRef.current) {
          return;
        }
        setStats({
          awaiting: results[0] ?? null,
          assignedToMe: results[1] ?? null,
          emergency: results[2] ?? null,
          loading: false,
        });
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStats(EMPTY);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  return { ...stats, refresh };
}
