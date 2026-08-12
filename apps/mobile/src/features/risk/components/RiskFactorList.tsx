import { View } from 'react-native';

import { AppCard, AppText, RiskBadge, SectionHeader } from '../../../design-system';
import type { RiskPriority } from '../../../data/domain/enums/domainEnums';
import { spacing } from '../../../theme';
import { riskStrings } from '../i18n/riskStrings';

export type FactorListItem = {
  readonly ruleId: string;
  readonly factorLabel: string;
  readonly priority: Exclude<RiskPriority, 'undetermined'> | RiskPriority;
  readonly explanationSummary: string;
  readonly sourceQuestionKey: string | null;
};

export function RiskFactorList(props: {
  readonly factors: readonly FactorListItem[];
  readonly testID?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }} testID={props.testID}>
      <SectionHeader title={riskStrings.factorsTitle} />
      {props.factors.length === 0 ? (
        <AppText variant="body" color="secondary">
          {riskStrings.factorsEmpty}
        </AppText>
      ) : (
        props.factors.map((factor) => (
          <AppCard key={factor.ruleId} testID={`risk-factor-${factor.ruleId}`}>
            <View style={{ gap: spacing.xs }}>
              <RiskBadge
                level={
                  factor.priority === 'undetermined' ? 'undetermined' : factor.priority
                }
              />
              <AppText variant="label">{factor.factorLabel}</AppText>
              <AppText variant="caption" color="secondary">
                {factor.explanationSummary}
              </AppText>
              {factor.sourceQuestionKey ? (
                <AppText variant="caption" color="secondary">
                  Source item: {factor.sourceQuestionKey}
                </AppText>
              ) : null}
            </View>
          </AppCard>
        ))
      )}
    </View>
  );
}
