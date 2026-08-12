import { View } from 'react-native';

import { AppText, CheckboxField } from '../../../design-system';
import { spacing } from '../../../theme';
import { riskStrings } from '../i18n/riskStrings';

export function WorkerAcknowledgement(props: {
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
  readonly testID?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }} testID={props.testID}>
      <CheckboxField
        label={riskStrings.acknowledgeLabel}
        checked={props.checked}
        onChange={props.onChange}
      />
      <AppText variant="caption" color="secondary">
        {riskStrings.acknowledgeHint}
      </AppText>
      <AppText variant="caption" color="secondary">
        {riskStrings.overrideUnavailable}
      </AppText>
    </View>
  );
}
