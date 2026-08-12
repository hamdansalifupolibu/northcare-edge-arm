import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { LoadingState } from '../../src/design-system';
import { useAuthSession } from '../../src/features/auth/providers/AuthSessionProvider';
import { useTranslation } from '../../src/i18n/LanguageProvider';
import { evaluateRouteAccess } from '../../src/navigation/routeAccess';
import { useThemeMode } from '../../src/theme/ThemeModeProvider';

export default function AdminLayout() {
  const t = useTranslation();
  const { semantic } = useThemeMode();
  const { authState, session, ready } = useAuthSession();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: semantic.background.primary }}>
        <LoadingState message={t.splash.preparing} presentation="startup" testID="admin-layout-loading" />
      </View>
    );
  }

  const access = evaluateRouteAccess('protected-admin', {
    authState,
    role: session?.role ?? null,
    availableRoles: session?.availableRoles,
    activeWorkspace: session?.activeWorkspace ?? null,
  });

  if (!access.allowed) {
    return <Redirect href={(access.redirectTo as '/') ?? '/(auth)/admin-login'} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: semantic.background.primary }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: semantic.background.primary } }} />
    </View>
  );
}
