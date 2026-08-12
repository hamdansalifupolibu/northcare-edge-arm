import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createRiskServices } from '../application/createRiskServices';

export function useRiskServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createRiskServices(db.repositories, {
      withTransaction: db.runInTransaction,
    });
  }, [db.repositories, db.runInTransaction]);
}
