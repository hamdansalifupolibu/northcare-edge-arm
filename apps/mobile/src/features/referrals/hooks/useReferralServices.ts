import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createReferralServices } from '../application/createReferralServices';

export function useReferralServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createReferralServices(db.repositories, {
      withTransaction: db.runInTransaction,
    });
  }, [db.repositories, db.runInTransaction]);
}
