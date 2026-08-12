import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import {
  createOfflineProvisioningServices,
  type OfflineProvisioningServices,
} from '../application/createOfflineProvisioningServices';

export function useOfflineProvisioningServices(): OfflineProvisioningServices | null {
  const { repositories, readiness } = useDatabase();
  return useMemo(() => {
    if (readiness !== 'ready' || repositories === null) {
      return null;
    }
    return createOfflineProvisioningServices(repositories.adminProvisioning);
  }, [readiness, repositories]);
}
