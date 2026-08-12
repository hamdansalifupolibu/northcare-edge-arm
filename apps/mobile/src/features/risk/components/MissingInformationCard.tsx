import { View } from 'react-native';

import { AppCard, AppText, SectionHeader } from '../../../design-system';
import { spacing } from '../../../theme';
import type { MissingInformationRecord } from '../domain/input';
import { riskStrings } from '../i18n/riskStrings';

export function MissingInformationCard(props: {
  readonly items: readonly MissingInformationRecord[];
  readonly testID?: string;
}) {
  return (
    <AppCard testID={props.testID}>
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={riskStrings.missingTitle} />
        {props.items.length === 0 ? (
          <AppText variant="body" color="secondary">
            {riskStrings.missingEmpty}
          </AppText>
        ) : (
          props.items.map((item) => (
            <View key={`${item.questionKey}:${item.reason}`} style={{ gap: spacing.xxs }}>
              <AppText variant="label">{item.workerFacingLabel}</AppText>
              <AppText variant="caption" color="secondary">
                {item.blocking ? 'Blocking' : 'Non-blocking'} · {item.reason}
              </AppText>
            </View>
          ))
        )}
      </View>
    </AppCard>
  );
}
