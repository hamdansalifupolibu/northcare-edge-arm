import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { asHref } from '../../../navigation/href';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { VoiceClientContextCard } from '../components/VoiceClientContextCard';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import { useVoiceClientContext } from '../hooks/useVoiceClientContext';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { preloadWhisperModel } from '../providers/transcription/WhisperTranscriptionProvider';
import { voiceBasePath } from './VoiceEntryScreen';

export function VoiceConsentScreen() {
  const voiceStrings = useVoiceStrings();
  const { clientId, sessionId, visitId } = useLocalSearchParams<{
    clientId: string;
    sessionId: string;
    visitId?: string;
  }>();
  const router = useRouter();
  const { account, authState } = useAuthSession();
  const services = useVoiceServices();
  const { context: clientContext } = useVoiceClientContext(clientId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = authState === 'locked';

  useEffect(() => {
    void preloadWhisperModel().catch(() => {});
  }, []);

  const record = useCallback(
    async (status: 'recorded' | 'declined' | 'deferred') => {
      if (!services || !account?.accountId || !sessionId || locked) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await services.recordConsent({
          sessionId,
          status,
          accountId: account.accountId,
        });
        if (status === 'declined') {
          router.replace(asHref(`${voiceBasePath(clientId, visitId)}/transcript?sessionId=${sessionId}`));
          return;
        }
        router.replace(asHref(`${voiceBasePath(clientId, visitId)}/record?sessionId=${sessionId}`));
      } catch (caught) {
        setError(mapVoiceServiceError(caught));
      } finally {
        setBusy(false);
      }
    },
    [services, account, sessionId, clientId, visitId, locked, router],
  );

  if (!services) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.loading} />
      </AppScreen>
    );
  }

  const footer = (
    <View style={styles.footerActions}>
      <AppButton
        label={voiceStrings.consentRecorded}
        onPress={() => void record('recorded')}
        disabled={busy || locked}
      />
      <AppButton
        label={voiceStrings.consentDeferred}
        variant="secondary"
        onPress={() => void record('deferred')}
        disabled={busy || locked}
      />
      <AppButton
        label={voiceStrings.consentDeclined}
        variant="tertiary"
        onPress={() => void record('declined')}
        disabled={busy || locked}
      />
    </View>
  );

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      footer={footer}
      testID="voice-consent-screen"
    >
      <View style={styles.body}>
        {clientContext ? (
          <VoiceClientContextCard
            clientName={clientContext.clientName}
            categoryLabel={clientContext.categoryLabel}
          />
        ) : null}
        <AppText variant="headingSmall">{voiceStrings.consentTitle}</AppText>
        <AppText variant="body">{voiceStrings.consentBody}</AppText>
        {locked ? (
          <AppText variant="body" color="warning">
            {voiceStrings.lockedActionBlocked}
          </AppText>
        ) : null}
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
      </View>
    </VoiceToCareShell>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  footerActions: {
    gap: spacing.sm,
  },
});
