import { Redirect } from 'expo-router';

/** Legacy route — workspace selection now opens login directly. */
export default function WorkerEntryRoute() {
  return <Redirect href="/(auth)/worker-login" />;
}
