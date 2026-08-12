import { AppText } from '../text/AppText';

export type ScreenTitleProps = {
  readonly children: string;
  readonly testID?: string;
};

export function ScreenTitle({ children, testID }: ScreenTitleProps) {
  return (
    <AppText
      testID={testID}
      variant="headingMedium"
      accessibilityRole="header"
    >
      {children}
    </AppText>
  );
}
