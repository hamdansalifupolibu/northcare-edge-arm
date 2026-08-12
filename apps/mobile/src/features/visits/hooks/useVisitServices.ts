import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createVisitServices } from '../application/createVisitServices';

export function useVisitServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createVisitServices(db.repositories, {
      withTransaction: db.runInTransaction,
    });
  }, [db.repositories, db.runInTransaction]);
}
