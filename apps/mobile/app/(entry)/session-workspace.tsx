import { Redirect } from 'expo-router';

import { SessionWorkspaceScreen } from '../../src/features/administration/screens/SessionWorkspaceScreen';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { evaluateRouteAccess } from '../../src/navigation/routeAccess';

export default function SessionWorkspaceRoute() {
  const { authState, session, ready } = useAuthSession();
  if (!ready) {
    return null;
  }

  const access = evaluateRouteAccess('auth-workspace-selection', {
    authState,
    role: session?.role ?? null,
    availableRoles: session?.availableRoles,
    activeWorkspace: session?.activeWorkspace ?? null,
  });

  if (!access.allowed) {
    return <Redirect href={(access.redirectTo as '/') ?? '/'} />;
  }

  return <SessionWorkspaceScreen />;
}
