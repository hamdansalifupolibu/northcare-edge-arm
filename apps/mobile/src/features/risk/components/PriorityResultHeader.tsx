import { View } from 'react-native';

import { RiskIcon, RiskSummaryCard, AppText } from '../../../design-system';
import type { RiskPriority } from '../../../data/domain/enums/domainEnums';
import { spacing } from '../../../theme';
import { PRIORITY_DISPLAY } from '../domain/priorities';

export function PriorityResultHeader(props: {
  readonly priority: RiskPriority;
  readonly developmentBanner?: string | null;
  readonly testID?: string;
}) {
  return (
    <View style={{ gap: spacing.base }} testID={props.testID}>
      {props.developmentBanner ? (
        <AppText variant="caption" color="warning">
          {props.developmentBanner}
        </AppText>
      ) : null}
      <RiskSummaryCard level={props.priority} />
      <View
        accessible
        accessibilityLabel={PRIORITY_DISPLAY[props.priority].accessibilityLabel}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        <RiskIcon level={props.priority} size={28} />
        <AppText variant="title">{PRIORITY_DISPLAY[props.priority].label}</AppText>
      </View>
    </View>
  );
}
