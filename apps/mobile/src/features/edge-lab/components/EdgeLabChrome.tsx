import { Redirect, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { AppText, ScrollableAppScreen } from '../../../design-system';
import { evaluateRouteAccess } from '../../../navigation/routeAccess';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { EDGE_LAB_ROUTES, type EdgeLabRouteKey } from '../navigation/edgeLabRoutes';

const NAV_ITEMS: readonly { key: EdgeLabRouteKey; label: string }[] = [
  { key: 'overview', label: 'Results' },
  { key: 'compare', label: 'Compare' },
  { key: 'experiments', label: 'Experiments' },
  { key: 'timeline', label: 'Story' },
  { key: 'export', label: 'Export' },
];

type EdgeLabChromeProps = {
  readonly title: string;
  readonly active: EdgeLabRouteKey;
  readonly children: ReactNode;
  readonly testID?: string;
};

/**
 * Shared development-only shell + section navigation for Edge Lab.
 */
export function EdgeLabChrome({ title, active, children, testID }: EdgeLabChromeProps) {
  const config = getAppConfig();
  const router = useRouter();
  const { colors: themeColors, semantic } = useThemeMode();
  const access = evaluateRouteAccess('development-only', {
    diagnosticsEnabled: config.diagnosticsEnabled,
  });

  if (!access.allowed) {
    return <Redirect href={(access.redirectTo as '/') ?? '/'} />;
  }

  if (config.appEnv === 'production') {
    return <Redirect href="/" />;
  }

  return (
    <ScrollableAppScreen testID={testID} hideScrollIndicators>
      <View
        style={{
          backgroundColor: themeColors.primary,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <AppText variant="caption" color="inverse">
          NorthCare Edge · Arm
        </AppText>
        <AppText variant="title" color="inverse">
          {title}
        </AppText>
      </View>

      {/* Fixed-height wrapper: short screens (e.g. Export) must not stretch the nav pills. */}
      <View style={{ height: 48, marginBottom: spacing.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: 48 }}
          contentContainerStyle={{
            alignItems: 'center',
            gap: spacing.xs,
            paddingRight: spacing.sm,
            height: 48,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const selected = item.key === active;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  if (!selected) {
                    router.push(EDGE_LAB_ROUTES[item.key] as never);
                  }
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  height: 40,
                  borderRadius: radii.pill,
                  justifyContent: 'center',
                  backgroundColor: selected
                    ? themeColors.primary
                    : pressed
                      ? semantic.surface.muted
                      : semantic.surface.primary,
                  borderWidth: 1,
                  borderColor: selected ? themeColors.primary : semantic.border.default,
                })}
              >
                <AppText variant="label" color={selected ? 'inverse' : 'primary'}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {children}
    </ScrollableAppScreen>
  );
}
