import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

export function PrivacyAvatar({
  givenName,
  familyName,
  size = 48,
  testID,
  showTrailingSpace = true,
}: {
  readonly givenName: string;
  readonly familyName: string;
  readonly size?: number;
  readonly testID?: string;
  readonly showTrailingSpace?: boolean;
}) {
  const { semantic } = useThemeMode();
  const initials = `${givenName.trim().charAt(0)}${familyName.trim().charAt(0)}`.toUpperCase() || '?';
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: radii.pill,
        backgroundColor: semantic.surface.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: showTrailingSpace ? spacing.md : 0,
      }}
    >
      <AppText variant="label" color="secondary">
        {initials}
      </AppText>
    </View>
  );
}
