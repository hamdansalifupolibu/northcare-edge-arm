import { createDevelopmentAuthProvider } from './DevelopmentAuthProvider';
import { isDemoLocalAuthEnabled } from './demoLocalAuth';
import type { RemoteAuthProvider } from './RemoteAuthProvider';
import { createUnavailableAuthProvider } from './UnavailableAuthProvider';

/**
 * Factory for remote/demo auth.
 * - Demo local auth (hackathon / development APK): DevelopmentAuthProvider
 * - Otherwise fail closed until Firebase public config is provisioned
 */
export function createRemoteAuthProvider(): RemoteAuthProvider {
  if (isDemoLocalAuthEnabled()) {
    return createDevelopmentAuthProvider();
  }

  // Firebase public config not provisioned in this repository stage.
  return createUnavailableAuthProvider();
}
