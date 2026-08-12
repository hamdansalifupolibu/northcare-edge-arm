import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { asHref } from '../../../navigation/href';
import { voiceBasePath } from './VoiceEntryScreen';

/**
 * Legacy playback route — recording saved state now lives on VoiceRecordScreen.
 * Redirect to transcript review when a saved recording exists.
 */
export function VoicePlaybackScreen() {
  const { clientId, sessionId, visitId } = useLocalSearchParams<{
    clientId: string;
    sessionId: string;
    visitId?: string;
  }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(asHref(`${voiceBasePath(clientId, visitId)}/transcript?sessionId=${sessionId}`));
  }, [clientId, sessionId, visitId, router]);

  return null;
}
