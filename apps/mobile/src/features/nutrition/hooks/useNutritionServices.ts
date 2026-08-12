import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createNutritionServices } from '../application/createNutritionServices';

export function useNutritionServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createNutritionServices(db.repositories, {
      withTransaction: db.runInTransaction,
    });
  }, [db.repositories, db.runInTransaction]);
}
