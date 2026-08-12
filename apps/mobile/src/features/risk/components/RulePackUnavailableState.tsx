import { View } from 'react-native';

import { AppButton, AppText, ScreenTitle } from '../../../design-system';
import { spacing } from '../../../theme';
import { riskStrings } from '../i18n/riskStrings';

export function RulePackUnavailableState(props: {
  readonly onReturnToVisit: () => void;
  readonly onReview?: () => void;
  readonly testID?: string;
}) {
  return (
    <View style={{ gap: spacing.base }} testID={props.testID ?? 'risk-unavailable'}>
      <ScreenTitle>{riskStrings.unavailableTitle}</ScreenTitle>
      <AppText variant="body">{riskStrings.unavailableBody}</AppText>
      <AppButton
        label={riskStrings.unavailableActions.visitSummary}
        onPress={props.onReturnToVisit}
        testID="risk-unavailable-return"
      />
      {props.onReview ? (
        <AppButton
          label={riskStrings.unavailableActions.review}
          variant="tertiary"
          onPress={props.onReview}
        />
      ) : null}
    </View>
  );
}
