import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { LoadingState } from '../../src/design-system';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { WorkerWorkspaceShell } from '../../src/features/worker-home/components/WorkerWorkspaceShell';
import { useTranslation } from '../../src/i18n/LanguageProvider';
import { evaluateRouteAccess } from '../../src/navigation/routeAccess';

export default function WorkerLayout() {
  const t = useTranslation();
  const { authState, session, ready } = useAuthSession();

  if (!ready) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingState message={t.splash.preparing} presentation="startup" testID="worker-layout-loading" />
      </View>
    );
  }

  const access = evaluateRouteAccess('protected-worker', {
    authState,
    role: session?.role ?? null,
    availableRoles: session?.availableRoles,
    activeWorkspace: session?.activeWorkspace ?? null,
  });

  if (!access.allowed) {
    return <Redirect href={(access.redirectTo as '/') ?? '/(auth)/worker-login'} />;
  }

  return (
    <WorkerWorkspaceShell>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }} />
      </View>
    </WorkerWorkspaceShell>
  );
}
