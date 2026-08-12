import type { LaunchRoute } from '../../launch/launchState';
import type { WorkspacePreference } from '../../preferences';

/**
 * Route after onboarding completes — workspace selection or the matching login entry.
 */
export function resolvePostOnboardingRoute(
  selectedWorkspace: WorkspacePreference | null,
): LaunchRoute {
  if (selectedWorkspace === 'worker') {
    return '/(auth)/worker-login';
  }
  if (selectedWorkspace === 'administrator') {
    return '/(auth)/admin-login';
  }
  return '/(entry)/workspace-selection';
}
