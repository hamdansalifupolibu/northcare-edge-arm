import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createAssistantServices } from '../application/createAssistantServices';

export function useAssistantServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createAssistantServices(db.repositories);
  }, [db.repositories]);
}
