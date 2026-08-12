import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  ScrollableAppScreen,
  ScreenTitle,
} from '../../../design-system';
import { assertEntityId } from '../../../data/domain/value-objects/EntityId';
import { spacing } from '../../../theme';
import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from '../content/development/syntheticDevPriorityRulePack';
import { evaluateRisk } from '../engine/evaluator';
import { buildRiskEngineInput } from '../engine/inputResolver';
import type { RiskEvaluationOutcome } from '../domain/results';
import { PriorityResultHeader } from '../components/PriorityResultHeader';
import { RiskFactorList } from '../components/RiskFactorList';
import { MissingInformationCard } from '../components/MissingInformationCard';
import { riskStrings } from '../i18n/riskStrings';
import type { RecordedScreeningAnswer } from '../../screening/content/types';

type Scenario = 'red' | 'amber' | 'green' | 'undetermined';

function answersFor(scenario: Scenario): readonly RecordedScreeningAnswer[] {
  if (scenario === 'red') {
    return [
      { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: true } },
      {
        questionId: 'item_a2',
        state: 'answered',
        value: { kind: 'option', value: 'option_one' },
      },
      {
        questionId: 'item_b1_weight',
        state: 'answered',
        value: { kind: 'measurement', value: 70, unit: 'kg' },
      },
      {
        questionId: 'item_b3_ack',
        state: 'answered',
        value: { kind: 'acknowledgement', acknowledged: true },
      },
    ];
  }
  if (scenario === 'amber') {
    return [
      { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: false } },
      {
        questionId: 'item_a2',
        state: 'answered',
        value: { kind: 'option', value: 'option_two' },
      },
      {
        questionId: 'item_b1_weight',
        state: 'answered',
        value: { kind: 'measurement', value: 70, unit: 'kg' },
      },
      {
        questionId: 'item_b3_ack',
        state: 'answered',
        value: { kind: 'acknowledgement', acknowledged: true },
      },
    ];
  }
  if (scenario === 'green') {
    return [
      { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: false } },
      {
        questionId: 'item_a2',
        state: 'answered',
        value: { kind: 'option', value: 'option_one' },
      },
      {
        questionId: 'item_b1_weight',
        state: 'answered',
        value: { kind: 'measurement', value: 70, unit: 'kg' },
      },
      {
        questionId: 'item_b3_ack',
        state: 'answered',
        value: { kind: 'acknowledgement', acknowledged: true },
      },
    ];
  }
  return [
    { questionId: 'item_a1', state: 'unknown' },
    {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: 'option_one' },
    },
    { questionId: 'item_b1_weight', state: 'notAssessed' },
    {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  ];
}

export function RiskEnginePreviewScreen() {
  const [scenario, setScenario] = useState<Scenario>('red');
  const outcome = useMemo<RiskEvaluationOutcome>(() => {
    const input = buildRiskEngineInput({
      evaluationId: 'preview-eval',
      client: {
        id: assertEntityId('00000000-0000-4000-8000-000000000001'),
        category: 'pregnant',
        dateOfBirth: null,
        approximateAge: 25,
        approximateAgeUnit: 'years',
      },
      encounterId: assertEntityId('00000000-0000-4000-8000-000000000002'),
      visitType: 'antenatalVisit',
      screeningId: assertEntityId('00000000-0000-4000-8000-000000000003'),
      screeningType: 'antenatal',
      screeningTemplateId: 'synthetic-dev-workflow-v1',
      screeningTemplateVersion: 1,
      answers: answersFor(scenario),
      measurements: [],
      completionState: 'completed',
      workerConfirmation: true,
      referenceDateOnly: '2026-08-02',
      applicableRulePackId: SYNTHETIC_DEV_PRIORITY_RULE_PACK.rulePackId,
      applicableRulePackVersion: SYNTHETIC_DEV_PRIORITY_RULE_PACK.version,
    });
    return evaluateRisk(input, SYNTHETIC_DEV_PRIORITY_RULE_PACK);
  }, [scenario]);

  return (
    <ScrollableAppScreen testID="risk-engine-preview">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{riskStrings.previewTitle}</ScreenTitle>
        <AppText variant="body">{riskStrings.previewBody}</AppText>
        <View style={{ gap: spacing.sm }}>
          {(['red', 'amber', 'green', 'undetermined'] as const).map((item) => (
            <AppButton
              key={item}
              label={`Evaluate ${item.toUpperCase()} example`}
              variant={scenario === item ? 'primary' : 'secondary'}
              onPress={() => setScenario(item)}
              testID={`risk-preview-${item}`}
            />
          ))}
        </View>
        <PriorityResultHeader
          priority={outcome.priority}
          developmentBanner={outcome.developmentBanner}
        />
        <AppText variant="caption" color="secondary">
          Matched rules: {outcome.matchedFactors.map((f) => f.ruleId).join(', ') || 'none'}
        </AppText>
        <RiskFactorList
          factors={outcome.matchedFactors.map((factor) => ({
            ruleId: factor.ruleId,
            factorLabel: factor.factorLabel,
            priority: factor.priority,
            explanationSummary: factor.explanationSummary,
            sourceQuestionKey: factor.sourceQuestionKey,
          }))}
        />
        <MissingInformationCard items={outcome.missingInformation} />
      </View>
    </ScrollableAppScreen>
  );
}
