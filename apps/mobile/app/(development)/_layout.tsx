import { Redirect, Stack } from 'expo-router';

import { evaluateRouteAccess } from '../../src/navigation/routeAccess';

export default function DevelopmentLayout() {
  const access = evaluateRouteAccess('development-only');
  if (!access.allowed) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
