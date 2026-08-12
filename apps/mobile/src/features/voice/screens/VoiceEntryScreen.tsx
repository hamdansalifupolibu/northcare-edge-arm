import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { asHref } from '../../../navigation/href';
import { useLanguage } from '../../../i18n/LanguageProvider';
import { useRequestLanguage } from '../../../i18n/LanguageDisclaimerProvider';
import { mapTranscriptionLanguage } from '../../../i18n/transcriptionLanguage';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { VoiceClientContextCard } from '../components/VoiceClientContextCard';
import { VoiceTranscriptHeaderActions } from '../components/VoiceTranscriptReviewUI';
import { VoiceOrb } from '../components/VoiceOrb';
import {
  VoiceLanguageSelector,
  VoiceToCareShell,
} from '../components/VoiceToCareShell';
import { VoiceViewRecordingsCard } from '../components/VoiceViewRecordingsCard';
import { useVoiceClientContext } from '../hooks/useVoiceClientContext';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { preloadWhisperModel } from '../providers/transcription/WhisperTranscriptionProvider';

type VoiceRouteParams = {
  clientId: string;
  sessionId?: string;
  visitId?: string;
};

function voiceBasePath(clientId: string, visitId?: string): string {
  if (visitId) {
    return `/(worker)/clients/${clientId}/visits/${visitId}/voice`;
  }
  return `/(worker)/clients/${clientId}/voice`;
}

export function VoiceEntryScreen() {
  const voiceStrings = useVoiceStrings();
  const { language, getLanguageInfo, supportedLanguages } = useLanguage();
  const { requestLanguage } = useRequestLanguage();
  const { clientId, sessionId, visitId } = useLocalSearchParams<VoiceRouteParams>();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useVoiceServices();
  const { context: clientContext, loading: clientLoading } = useVoiceClientContext(clientId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const locked = authState === 'locked';
  const languageInfo = getLanguageInfo(language);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    void preloadWhisperModel().catch(() => {});
  }, []);

  useEffect(() => {
    if (!services || !sessionId) {
      return;
    }
    void (async () => {
      const bundle = await services.getSessionBundle(sessionId);
      setConsentConfirmed(bundle?.session.consentStatus === 'recorded');
    })();
  }, [services, sessionId]);

  const ensureSession = useCallback(async () => {
    if (!services || !account?.accountId || !clientId || locked) {
      return null;
    }
    const session = sessionId
      ? (await services.getSessionBundle(sessionId))?.session
      : await services.startSession({
          clientId,
          encounterId: visitId ?? null,
          accountId: account.accountId,
          languageHint: mapTranscriptionLanguage(language),
        });
    if (session) {
      const bundle = await services.getSessionBundle(session.id);
      setConsentConfirmed(bundle?.session.consentStatus === 'recorded');
    }
    return session;
  }, [services, account, clientId, visitId, sessionId, locked, language]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) {
        setError(voiceStrings.missing);
        return;
      }
      const bundle = await services!.getSessionBundle(session.id);
      if (bundle?.session.consentStatus !== 'recorded') {
        router.push(asHref(`${voiceBasePath(clientId, visitId)}/consent?sessionId=${session.id}`));
        return;
      }
      router.push(asHref(`${voiceBasePath(clientId, visitId)}/record?sessionId=${session.id}`));
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      setBusy(false);
    }
  }, [ensureSession, services, clientId, visitId, router, voiceStrings.missing]);

  const openManual = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) {
        setError(voiceStrings.missing);
        return;
      }
      router.push(
        asHref(`${voiceBasePath(clientId, visitId)}/transcript?sessionId=${session.id}&manual=1`),
      );
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      setBusy(false);
    }
  }, [ensureSession, clientId, visitId, router, voiceStrings.missing]);

  const cycleLanguage = useCallback(() => {
    const currentIndex = supportedLanguages.findIndex((item) => item.code === language);
    const next = supportedLanguages[(currentIndex + 1) % supportedLanguages.length];
    if (next) {
      requestLanguage(next.code);
    }
  }, [language, requestLanguage, supportedLanguages]);

  const openRecordings = useCallback(() => {
    router.push(
      asHref(`/(worker)/voice/recordings${clientId ? `?clientId=${clientId}` : ''}`),
    );
  }, [clientId, router]);

  if (!services || clientLoading) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.loading} />
      </AppScreen>
    );
  }

  const footer = (
    <View style={styles.footerActions}>
      <AppButton
        label={voiceStrings.recordStart}
        onPress={() => void start()}
        disabled={busy || locked}
        testID="voice-entry-start"
      />
      <AppButton
        label={voiceStrings.manualTranscriptCta}
        variant="secondary"
        disabled={busy || locked}
        onPress={() => void openManual()}
      />
    </View>
  );

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      rightAction={<VoiceTranscriptHeaderActions />}
      footer={footer}
      testID="voice-entry-screen"
    >
      <View style={styles.body}>
        {clientContext ? (
          <VoiceClientContextCard
            clientName={clientContext.clientName}
            categoryLabel={clientContext.categoryLabel}
            consentConfirmed={consentConfirmed}
            onChange={() => router.back()}
          />
        ) : null}

        <View style={styles.centerBlock}>
          <VoiceOrb mode="idle" size={220} />
          <AppText variant="body" color="secondary">
            {voiceStrings.entryBody}
          </AppText>
        </View>

        <VoiceLanguageSelector languageLabel={languageInfo.nativeName} onPress={cycleLanguage} />
        <VoiceViewRecordingsCard onPress={openRecordings} />

        {locked ? (
          <AppText variant="body" color="warning">
            {voiceStrings.lockedBanner}
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

export { voiceBasePath };

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  centerBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  footerActions: {
    gap: spacing.sm,
  },
});
