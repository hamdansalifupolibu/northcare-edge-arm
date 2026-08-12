import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createClientServices } from '../application/createClientServices';

export function useClientServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createClientServices(db.repositories, {
      withTransaction: db.runInTransaction,
    });
  }, [db.repositories, db.runInTransaction]);
}
