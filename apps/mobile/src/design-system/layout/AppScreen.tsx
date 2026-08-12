import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '../../theme';
import { useThemeMode } from '../../theme/ThemeModeProvider';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

export type AppScreenProps = {
  readonly children: ReactNode;
  readonly padded?: boolean;
  readonly keyboardAware?: boolean;
  readonly statusBarStyle?: 'dark' | 'light' | 'auto';
  readonly background?: 'primary' | 'secondary' | 'surface';
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

function resolveBackgroundColor(
  background: NonNullable<AppScreenProps['background']>,
  semantic: ReturnType<typeof useThemeMode>['semantic'],
): string {
  if (background === 'surface') {
    return semantic.surface.primary;
  }
  return semantic.background[background];
}

/**
 * Non-scrolling screen shell with safe-area and optional keyboard avoidance.
 */
export function AppScreen({
  children,
  padded = true,
  keyboardAware = false,
  statusBarStyle = 'auto',
  background = 'primary',
  style,
  testID,
}: AppScreenProps) {
  const { semantic, isDark } = useThemeMode();
  const resolvedStatusBarStyle =
    statusBarStyle === 'auto' ? (isDark ? 'light' : 'dark') : statusBarStyle;
  const keyboardInset = useKeyboardBottomInset();
  const androidKeyboardPad =
    keyboardAware && Platform.OS === 'android' ? keyboardInset : 0;
  const content = (
    <View
      style={[
        {
          flex: 1,
          paddingHorizontal: padded ? layout.screenHorizontalPadding : 0,
          paddingTop: padded ? layout.screenTopSpacing : 0,
          paddingBottom:
            (padded ? layout.screenBottomSpacing : 0) +
            androidKeyboardPad +
            (androidKeyboardPad > 0 ? spacing.base : 0),
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      testID={testID}
      style={{ flex: 1, backgroundColor: resolveBackgroundColor(background, semantic) }}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={resolvedStatusBarStyle} />
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
