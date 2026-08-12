import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createAssistantConversationServices } from '../application/createAssistantConversationServices';

export function useAssistantConversationServices() {
  const db = useDatabase();
  return useMemo(() => {
    if (!db.repositories) {
      return null;
    }
    return createAssistantConversationServices(db.repositories);
  }, [db.repositories]);
}
