import { AppText } from '../text/AppText';
import { IconButton } from '../buttons/IconButton';

export type BackButtonProps = {
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
};

/**
 * Foundation back control. Accepts a callback — does not assume a router (Stage 4).
 */
export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
  testID,
}: BackButtonProps) {
  return (
    <IconButton
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      <AppText variant="headingSmall" color="action">
        ←
      </AppText>
    </IconButton>
  );
}
