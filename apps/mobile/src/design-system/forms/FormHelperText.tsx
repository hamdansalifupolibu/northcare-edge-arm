import { AppText } from '../text/AppText';

export type FormHelperTextProps = {
  readonly children: string;
  readonly testID?: string;
  readonly nativeID?: string;
};

export function FormHelperText({ children, testID, nativeID }: FormHelperTextProps) {
  return (
    <AppText testID={testID} nativeID={nativeID} variant="caption" color="secondary">
      {children}
    </AppText>
  );
}
