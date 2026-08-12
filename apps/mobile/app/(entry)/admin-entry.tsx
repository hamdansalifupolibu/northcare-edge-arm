import { Redirect } from 'expo-router';

/** Legacy route — workspace selection now opens login directly. */
export default function AdminEntryRoute() {
  return <Redirect href="/(auth)/admin-login" />;
}
