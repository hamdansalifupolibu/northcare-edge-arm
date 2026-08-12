import { Redirect } from 'expo-router';

import { getAppConfig } from '../../src/config/appConfig';
import { ReminderCentreScreen } from '../../src/features/reminders/screens/ReminderCentreScreen';

/** Development-only Reminder Centre preview — fail closed outside development. */
export default function ReminderPreviewRoute() {
  if (getAppConfig().appEnv === 'production') {
    return <Redirect href="/" />;
  }
  return <ReminderCentreScreen />;
}
