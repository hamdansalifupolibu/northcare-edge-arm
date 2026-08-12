import { Redirect } from 'expo-router';

/** Canonical Sync Centre route lives at /(worker)/sync-centre. */
export default function MoreSyncRedirect() {
  return <Redirect href="/(worker)/sync-centre" />;
}
