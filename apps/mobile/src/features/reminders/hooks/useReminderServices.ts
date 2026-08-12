import { useMemo } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { createReminderServices } from '../application/createReminderServices';
import { createLocalNotificationScheduler } from '../scheduling/LocalNotificationScheduler';

const scheduler = createLocalNotificationScheduler();

export function useReminderServices() {
  const { repositories } = useDatabase();
  return useMemo(
    () => (repositories ? createReminderServices(repositories, scheduler) : null),
    [repositories],
  );
}
