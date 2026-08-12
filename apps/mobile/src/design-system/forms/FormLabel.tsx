import { View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from '../text/AppText';

export type FormLabelProps = {
  readonly children: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly nativeID?: string;
  readonly testID?: string;
};

export function FormLabel({
  children,
  required = false,
  disabled = false,
  nativeID,
  testID,
}: FormLabelProps) {
  return (
    <View
      testID={testID}
      style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs }}
    >
      <AppText
        nativeID={nativeID}
        variant="bodyStrong"
        color={disabled ? 'disabled' : 'primary'}
      >
        {children}
      </AppText>
      {required ? (
        <AppText
          variant="bodyStrong"
          color="urgent"
          accessibilityLabel="required"
        >
          *
        </AppText>
      ) : null}
    </View>
  );
}
