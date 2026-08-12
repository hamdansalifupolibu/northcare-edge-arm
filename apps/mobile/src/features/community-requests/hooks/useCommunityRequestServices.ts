import { createContext, useContext, useMemo, type ReactNode, createElement } from 'react';

import { createDemoAwareCommunityRequestServices } from '../application/createDemoAwareCommunityRequestServices';
import { createCommunityRequestServices } from '../application/createCommunityRequestServices';
import type { CommunityRequestServices } from '../application/createCommunityRequestServices';
import { createCommunityRequestsApiClient } from '../transport/communityRequestsApiClient';

const CommunityRequestServicesContext = createContext<CommunityRequestServices | null>(null);

export function CommunityRequestServicesProvider({
  children,
  services,
}: {
  readonly children: ReactNode;
  readonly services?: CommunityRequestServices;
}) {
  const value = useMemo(() => {
    const base =
      services ?? createCommunityRequestServices(createCommunityRequestsApiClient());
    return createDemoAwareCommunityRequestServices(base);
  }, [services]);
  return createElement(CommunityRequestServicesContext.Provider, { value }, children);
}

export function useCommunityRequestServices(): CommunityRequestServices {
  const ctx = useContext(CommunityRequestServicesContext);
  if (ctx === null) {
    return createDemoAwareCommunityRequestServices(
      createCommunityRequestServices(createCommunityRequestsApiClient()),
    );
  }
  return ctx;
}
