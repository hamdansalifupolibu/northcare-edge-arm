import { ActivityIndicator } from 'react-native';

import { useThemeMode } from '../../theme/ThemeModeProvider';

export type AppActivityIndicatorProps = {
  readonly size?: 'small' | 'large';
  readonly testID?: string;
};

export function AppActivityIndicator({
  size = 'large',
  testID,
}: AppActivityIndicatorProps) {
  const { semantic } = useThemeMode();

  return (
    <ActivityIndicator
      testID={testID}
      size={size}
      color={semantic.action.primary}
      accessibilityLabel="Loading"
    />
  );
}
