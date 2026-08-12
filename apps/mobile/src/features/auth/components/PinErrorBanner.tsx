import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { colors, radii, spacing } from '../../../theme';

type Props = {
  readonly message: string;
  readonly testID?: string;
};

/** Prominent inline PIN error — stays directly under the digit row. */
export function PinErrorBanner({ message, testID }: Props) {
  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <AppText variant="bodyStrong" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerBackground,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECDCA',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  text: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '700',
  },
});
