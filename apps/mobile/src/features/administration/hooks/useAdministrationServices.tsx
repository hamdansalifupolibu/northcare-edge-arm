import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createAdministrationServices } from '../application/createAdministrationServices';
import type { AdministrationServices } from '../application/createAdministrationServices';
import { createAdministrationApiClient } from '../transport/administrationApiClient';

const AdministrationServicesContext = createContext<AdministrationServices | null>(null);

let defaultAdministrationServices: AdministrationServices | null = null;

function getDefaultAdministrationServices(): AdministrationServices {
  if (defaultAdministrationServices === null) {
    defaultAdministrationServices = createAdministrationServices(createAdministrationApiClient());
  }
  return defaultAdministrationServices;
}

export function AdministrationServicesProvider({
  children,
  services,
}: {
  readonly children: ReactNode;
  readonly services?: AdministrationServices;
}) {
  const value = useMemo(
    () => services ?? createAdministrationServices(createAdministrationApiClient()),
    [services],
  );
  return (
    <AdministrationServicesContext.Provider value={value}>
      {children}
    </AdministrationServicesContext.Provider>
  );
}

export function useAdministrationServices(): AdministrationServices {
  const ctx = useContext(AdministrationServicesContext);
  return ctx ?? getDefaultAdministrationServices();
}
