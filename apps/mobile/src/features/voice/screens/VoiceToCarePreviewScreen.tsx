import { View } from 'react-native';

import { AppText, ScreenTitle, ScrollableAppScreen } from '../../../design-system';
import { getAppConfig } from '../../../config/appConfig';
import { spacing } from '../../../theme';
import {
  countApprovedForPilotExtractionSchemas,
  listAllRegisteredExtractionSchemasForInventory,
  listLoadableExtractionSchemas,
} from '../providers/extraction/schemas/registry';
import {
  countApprovedProductionTranscriptionProviders,
  selectTranscriptionProvider,
} from '../providers/transcription/selectTranscriptionProvider';
import {
  countApprovedProductionExtractionProviders,
  selectExtractionProvider,
} from '../providers/extraction/selectExtractionProvider';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

/**
 * Development-only preview. Production layout redirects away via route access.
 */
export function VoiceToCarePreviewScreen() {
  const voiceStrings = useVoiceStrings();
const env = getAppConfig().appEnv;
  const transcription = selectTranscriptionProvider(env);
  const extraction = selectExtractionProvider(env);
  const schemas = listLoadableExtractionSchemas(env);
  const allSchemas = listAllRegisteredExtractionSchemasForInventory();

  return (
    <ScrollableAppScreen>
      <View style={{ gap: spacing.lg }} testID="voice-to-care-preview-screen">
        <ScreenTitle>{voiceStrings.developmentPreviewTitle}</ScreenTitle>
        <AppText variant="caption" color="warning">
          {voiceStrings.developmentPreviewBanner}
        </AppText>
        <AppText variant="body">
          Environment: {env}. Production transcription providers:{' '}
          {countApprovedProductionTranscriptionProviders()}. Production extraction providers:{' '}
          {countApprovedProductionExtractionProviders()}. APPROVED_FOR_PILOT schemas:{' '}
          {countApprovedForPilotExtractionSchemas()}.
        </AppText>
        <AppText variant="label">Transcription provider</AppText>
        <AppText variant="caption" color="secondary">
          {transcription.id} · {transcription.availability}
        </AppText>
        <AppText variant="label">Extraction provider</AppText>
        <AppText variant="caption" color="secondary">
          {extraction.id} · {extraction.availability}
        </AppText>
        <AppText variant="label">Loadable schemas ({schemas.length})</AppText>
        {allSchemas.map((schema) => (
          <View key={schema.schemaId} style={{ gap: spacing.xs }}>
            <AppText variant="label">{schema.title}</AppText>
            <AppText variant="caption" color="secondary">
              {schema.schemaId} · {schema.status}
            </AppText>
          </View>
        ))}
      </View>
    </ScrollableAppScreen>
  );
}
