import { View } from 'react-native';

import { AppCard, AppText, SectionHeader } from '../../../design-system';
import { spacing } from '../../../theme';

export function PriorityExplanationCard(props: {
  readonly summary: string;
  readonly detail: string;
  readonly testID?: string;
}) {
  return (
    <AppCard testID={props.testID}>
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Explanation" />
        <AppText variant="body">{props.summary}</AppText>
        <AppText variant="caption" color="secondary">
          {props.detail}
        </AppText>
      </View>
    </AppCard>
  );
}
