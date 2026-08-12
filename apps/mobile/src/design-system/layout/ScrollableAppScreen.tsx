import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

export type ScrollableAppScreenProps = {
  readonly children: ReactNode;
  readonly padded?: boolean;
  readonly keyboardAware?: boolean;
  readonly statusBarStyle?: 'dark' | 'light' | 'auto';
  readonly background?: 'primary' | 'secondary' | 'surface';
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  readonly bottomClearance?: boolean;
  /** Hide scrollbars (avoids brief white flash on Android when remounting short screens). */
  readonly hideScrollIndicators?: boolean;
  readonly testID?: string;
};

function resolveBackgroundColor(
  background: NonNullable<ScrollableAppScreenProps['background']>,
  semantic: ReturnType<typeof useThemeMode>['semantic'],
): string {
  if (background === 'surface') {
    return semantic.surface.primary;
  }
  return semantic.background[background];
}

export function ScrollableAppScreen({
  children,
  padded = true,
  keyboardAware = true,
  statusBarStyle = 'auto',
  background = 'primary',
  contentContainerStyle,
  bottomClearance = false,
  hideScrollIndicators = false,
  testID,
}: ScrollableAppScreenProps) {
  const { semantic, isDark } = useThemeMode();
  const resolvedStatusBarStyle =
    statusBarStyle === 'auto' ? (isDark ? 'light' : 'dark') : statusBarStyle;
  const keyboardInset = useKeyboardBottomInset();
  const keyboardPad =
    keyboardAware && Platform.OS === 'android' ? keyboardInset : 0;

  const scroll = (
    <ScrollView
      testID={testID}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={!hideScrollIndicators}
      showsHorizontalScrollIndicator={!hideScrollIndicators}
      overScrollMode={hideScrollIndicators ? 'never' : 'auto'}
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingHorizontal: padded ? layout.screenHorizontalPadding : 0,
          paddingTop: padded ? layout.screenTopSpacing : 0,
          paddingBottom:
            (padded ? layout.screenBottomSpacing : 0) +
            (bottomClearance ? layout.bottomNavigationClearance : 0) +
            keyboardPad +
            (keyboardPad > 0 ? spacing.base : 0),
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: resolveBackgroundColor(background, semantic) }}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={resolvedStatusBarStyle} />
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scroll}
        </KeyboardAvoidingView>
      ) : (
        scroll
      )}
    </SafeAreaView>
  );
}
