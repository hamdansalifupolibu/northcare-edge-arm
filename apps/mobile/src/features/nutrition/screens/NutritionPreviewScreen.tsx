import { View } from 'react-native';

import { AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { getAppConfig } from '../../../config/appConfig';
import { spacing } from '../../../theme';
import {
  countApprovedForDevelopmentGuidancePacks,
  countApprovedForDevelopmentReferencePacks,
  countApprovedForDevelopmentTemplates,
  countApprovedForPilotGuidancePacks,
  countApprovedForPilotReferencePacks,
  countApprovedForPilotTemplates,
  listAllRegisteredGuidancePacksForInventory,
  listAllRegisteredReferencePacksForInventory,
  listAllRegisteredTemplatesForInventory,
  listLoadableGuidancePacks,
  listLoadableNutritionTemplates,
  listLoadableReferencePacks,
} from '../content/registry';
import { useNutritionStrings } from '../hooks/useNutritionStrings';

export function NutritionPreviewScreen() {
  const nutritionStrings = useNutritionStrings();
const env = getAppConfig().appEnv;
  const loadableTemplates = listLoadableNutritionTemplates(env);
  const loadableReference = listLoadableReferencePacks(env);
  const loadableGuidance = listLoadableGuidancePacks(env);
  const allTemplates = listAllRegisteredTemplatesForInventory();
  const allReference = listAllRegisteredReferencePacksForInventory();
  const allGuidance = listAllRegisteredGuidancePacksForInventory();

  return (
    <ScrollableAppScreen testID="nutrition-preview-screen">
      <View style={{ gap: spacing.lg }}>
        <ScreenTitle>{nutritionStrings.developmentPreviewTitle}</ScreenTitle>
        <AppText variant="caption" color="warning">
          {nutritionStrings.developmentPreviewBanner}
        </AppText>
        <AppText variant="body">
          Environment: {env}. Registered templates: {allTemplates.length}. Loadable templates:{' '}
          {loadableTemplates.length}. APPROVED_FOR_PILOT templates:{' '}
          {countApprovedForPilotTemplates()}. APPROVED_FOR_DEVELOPMENT templates:{' '}
          {countApprovedForDevelopmentTemplates()}.
        </AppText>
        <AppText variant="body">
          Registered reference packs: {allReference.length}. Loadable reference packs:{' '}
          {loadableReference.length}. Pilot reference packs:{' '}
          {countApprovedForPilotReferencePacks()}. Development reference packs:{' '}
          {countApprovedForDevelopmentReferencePacks()}.
        </AppText>
        <AppText variant="body">
          Registered guidance packs: {allGuidance.length}. Loadable guidance packs:{' '}
          {loadableGuidance.length}. Pilot guidance packs:{' '}
          {countApprovedForPilotGuidancePacks()}. Development guidance packs:{' '}
          {countApprovedForDevelopmentGuidancePacks()}.
        </AppText>
        <AppText variant="caption" color="secondary">
          {nutritionStrings.developmentPreviewFailClosed}
        </AppText>
        <AppText variant="label">Templates</AppText>
        {allTemplates.map((template) => (
          <AppText key={template.templateId} variant="caption" color="secondary">
            {template.templateId} · v{template.version} · {template.status}
          </AppText>
        ))}
        <AppText variant="label">Reference packs</AppText>
        {allReference.map((pack) => (
          <AppText key={pack.referencePackId} variant="caption" color="secondary">
            {pack.referencePackId} · v{pack.version} · {pack.status}
          </AppText>
        ))}
        <AppText variant="label">Guidance packs</AppText>
        {allGuidance.map((pack) => (
          <AppText key={pack.guidancePackId} variant="caption" color="secondary">
            {pack.guidancePackId} · v{pack.version} · {pack.status}
          </AppText>
        ))}
      </View>
    </ScrollableAppScreen>
  );
}
