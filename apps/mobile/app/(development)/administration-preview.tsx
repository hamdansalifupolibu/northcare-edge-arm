import { Redirect } from 'expo-router';

import { getAppConfig } from '../../src/config/appConfig';
import { AdminHomeScreen } from '../../src/features/administration/screens/AdminHomeScreen';

/** Development-only administration preview — fail closed outside development. */
export default function AdministrationPreviewRoute() {
  if (getAppConfig().appEnv === 'production') {
    return <Redirect href="/" />;
  }
  return <AdminHomeScreen />;
}
