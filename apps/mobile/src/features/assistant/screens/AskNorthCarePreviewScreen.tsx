import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { AppButton, AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { spacing } from '../../../theme';
import { evaluateRouteAccess } from '../../../navigation/routeAccess';
import { DevelopmentAssistantBanner } from '../components/DevelopmentAssistantBanner';
import {
  DEVELOPMENT_SCENARIOS,
  assertDevelopmentSimulationAllowed,
} from '../providers/development/developmentSimulationProvider';
import { useAssistantServices } from '../hooks/useAssistantServices';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { futureConstrainedGenerativeProvider } from '../providers/futureGenerative/constrainedAssistantProvider';
import {
  countApprovedForPilotKnowledgePacks,
  listLoadableKnowledgePacks,
} from '../content/registry';

export function AskNorthCarePreviewScreen() {
  const assistantStrings = useAssistantStrings();
const config = getAppConfig();
  const access = evaluateRouteAccess('development-only', {
    diagnosticsEnabled: config.diagnosticsEnabled,
  });
  const router = useRouter();
  const services = useAssistantServices();
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  if (!access.allowed) {
    return <Redirect href={(access.redirectTo as '/') ?? '/'} />;
  }

  try {
    assertDevelopmentSimulationAllowed(config.appEnv);
  } catch {
    return <Redirect href="/" />;
  }

  const packs = listLoadableKnowledgePacks(config.appEnv);
  const inventory = services?.inventorySnapshot();

  return (
    <ScrollableAppScreen testID="ask-northcare-preview">
      <DevelopmentAssistantBanner message={assistantStrings.developmentPreviewBanner} />
      <ScreenTitle>Ask NorthCare preview</ScreenTitle>
      <AppText variant="body" color="secondary">
        Synthetic development scenarios only. Generative provider available:{' '}
        {String(futureConstrainedGenerativeProvider.available)}. Pilot packs:{' '}
        {countApprovedForPilotKnowledgePacks()}. Loadable packs: {packs.length}.
      </AppText>
      <View style={{ gap: spacing.sm }}>
        {DEVELOPMENT_SCENARIOS.map((scenario) => (
          <AppButton
            key={scenario.id}
            label={scenario.label}
            variant="secondary"
            onPress={() => {
              if (scenario.id === 'providerUnavailable') {
                setLastMessage(
                  `Provider ${futureConstrainedGenerativeProvider.providerId} available=${futureConstrainedGenerativeProvider.available}`,
                );
                return;
              }
              if (scenario.id === 'retiredArticle') {
                router.push(
                  '/(worker)/ask/article/article-retired-example' as never,
                );
                return;
              }
              setLastMessage(scenario.sampleQuestion);
              router.push('/(worker)/ask' as never);
            }}
            testID={`ask-preview-${scenario.id}`}
          />
        ))}
      </View>
      {lastMessage ? (
        <AppText variant="caption" color="secondary">
          Scenario question prepared (not persisted): use Ask NorthCare home to submit manually in
          development. Inventory packs={inventory?.registeredPackCount ?? 0}.
        </AppText>
      ) : null}
      <AppButton
        label="Open Ask NorthCare"
        onPress={() => router.push('/(worker)/ask' as never)}
      />
    </ScrollableAppScreen>
  );
}
