import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  LoadingState,
  ScrollableAppScreen,
  ScreenTitle,
} from '../../../design-system';
import { spacing } from '../../../theme';
import type { RiskHistoryItem } from '../application/createRiskServices';
import { RiskFactorList } from '../components/RiskFactorList';
import { useRiskServices } from '../hooks/useRiskServices';
import { riskStrings } from '../i18n/riskStrings';

export function RiskFactorsScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const services = useRiskServices();
  const [item, setItem] = useState<RiskHistoryItem | null>(null);

  useEffect(() => {
    if (!services || !visitId) {
      return;
    }
    void services.getCurrentForVisit(visitId).then(setItem);
  }, [services, visitId]);

  if (!item) {
    return (
      <ScrollableAppScreen>
        <LoadingState message={riskStrings.loading} />
      </ScrollableAppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="risk-factors-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{riskStrings.factorsTitle}</ScreenTitle>
        <RiskFactorList
          factors={item.factors.map((factor) => ({
            ruleId: factor.ruleId ?? factor.factorCode,
            factorLabel: factor.factorLabel,
            priority: factor.priority ?? item.assessment.priority,
            explanationSummary: factor.factorLabel,
            sourceQuestionKey: factor.sourceQuestionKey,
          }))}
        />
        <AppButton
          label={riskStrings.returnToVisit}
          onPress={() =>
            router.replace(`/(worker)/clients/${clientId}/visits/${visitId}/risk`)
          }
        />
      </View>
    </ScrollableAppScreen>
  );
}
