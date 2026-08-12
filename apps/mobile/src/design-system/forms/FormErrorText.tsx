import { AppText } from '../text/AppText';

export type FormErrorTextProps = {
  readonly children: string;
  readonly testID?: string;
  readonly nativeID?: string;
};

/**
 * Error text announced to assistive tech. Do not rely on red borders alone.
 */
export function FormErrorText({ children, testID, nativeID }: FormErrorTextProps) {
  return (
    <AppText
      testID={testID}
      nativeID={nativeID}
      variant="caption"
      color="urgent"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {children}
    </AppText>
  );
}
