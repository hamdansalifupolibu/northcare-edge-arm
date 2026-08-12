import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  LoadingState,
  RiskBadge,
  ScrollableAppScreen,
  ScreenTitle,
} from '../../../design-system';
import { spacing } from '../../../theme';
import type { RiskHistoryItem } from '../application/createRiskServices';
import { useRiskServices } from '../hooks/useRiskServices';
import { riskStrings } from '../i18n/riskStrings';

export function RiskHistoryScreen() {
  const { clientId, visitId } = useLocalSearchParams<{
    clientId: string;
    visitId: string;
  }>();
  const router = useRouter();
  const services = useRiskServices();
  const [items, setItems] = useState<readonly RiskHistoryItem[] | null>(null);

  useEffect(() => {
    if (!services || !visitId) {
      return;
    }
    void services.getHistoryForVisit(visitId).then(setItems);
  }, [services, visitId]);

  if (!items) {
    return (
      <ScrollableAppScreen>
        <LoadingState message={riskStrings.loading} />
      </ScrollableAppScreen>
    );
  }

  return (
    <ScrollableAppScreen testID="risk-history-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{riskStrings.historyTitle}</ScreenTitle>
        {items.length === 0 ? (
          <AppText variant="body" color="secondary">
            {riskStrings.historyEmpty}
          </AppText>
        ) : (
          items.map(({ assessment }) => (
            <AppCard key={assessment.id} testID={`risk-history-${assessment.id}`}>
              <View style={{ gap: spacing.xs }}>
                <RiskBadge level={assessment.priority} />
                <AppText variant="label">
                  {assessment.isCurrent
                    ? riskStrings.currentBadge
                    : riskStrings.supersededBadge}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {assessment.ruleSetVersion} · {assessment.calculatedAt}
                </AppText>
                {assessment.recalculationReason ? (
                  <AppText variant="caption" color="secondary">
                    Recalculation: {assessment.recalculationReason}
                  </AppText>
                ) : null}
              </View>
            </AppCard>
          ))
        )}
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
