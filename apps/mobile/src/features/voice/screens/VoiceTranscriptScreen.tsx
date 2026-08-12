import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { asHref } from '../../../navigation/href';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  LoadingState,
} from '../../../design-system';
import { getAppConfig } from '../../../config/appConfig';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { VoiceTranscript } from '../domain/types';
import { mapVoiceServiceError, type VoiceSessionBundle } from '../application/createVoiceServices';
import { VoiceOrb } from '../components/VoiceOrb';
import {
  VoiceAnalysisPrivacyNote,
  VoiceAnalysisProcessingSteps,
} from '../components/VoiceAnalysisProcessingSteps';
import {
  VoiceProcessingPrivacyNote,
  VoiceProcessingSteps,
} from '../components/VoiceProcessingSteps';
import {
  VoiceTranscriptAudioBar,
  VoiceTranscriptClientCard,
  VoiceTranscriptEditor,
  VoiceTranscriptHeaderActions,
  VoiceTranscriptHowItWorks,
  VoiceTranscriptPrivacyRow,
  VoiceTranscriptSectionHeader,
  voiceTranscriptReviewGapStyle,
} from '../components/VoiceTranscriptReviewUI';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import { useVoiceClientContext } from '../hooks/useVoiceClientContext';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { isDagbanliTranscriptionLanguage } from '../../../i18n/transcriptionLanguage';
import {
  analysisExtractionPercent,
  analysisStepFromPercent,
  speechTranscriptionPercent,
  processingStepFromPercent,
} from '../domain/voiceProcessingProgress';
import { WHISPER_TRANSCRIBE_ESTIMATE_MS } from '../providers/transcription/whisperTranscriptionOptions';
import { WhisperModelManager } from '../providers/transcription/whisperModelManager';
import { getOfflineAiServices } from '../../offline-ai/services/createOfflineAiServices';

export function VoiceTranscriptScreen() {
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
  const [bundle, setBundle] = useState<VoiceSessionBundle | null>(null);
  const [transcript, setTranscript] = useState<VoiceTranscript | null>(null);
  const [manualText, setManualText] = useState('');
  const [editText, setEditText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcribeElapsedMs, setTranscribeElapsedMs] = useState(0);
  const transcribeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [extractionPhase, setExtractionPhase] = useState<'extracting' | 'applying' | null>(null);
  const [extractionElapsedMs, setExtractionElapsedMs] = useState(0);
  const [processingPercentOverride, setProcessingPercentOverride] = useState<number | null>(null);
  const extractionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locked = authState === 'locked';
  const isDev = getAppConfig().appEnv === 'development';

  const startTranscribeTimer = useCallback(() => {
    setTranscribeElapsedMs(0);
    setProcessingPercentOverride(null);
    const t0 = Date.now();
    transcribeTimerRef.current = setInterval(() => {
      setTranscribeElapsedMs(Date.now() - t0);
    }, 150);
  }, []);

  const stopTranscribeTimer = useCallback(() => {
    if (transcribeTimerRef.current) {
      clearInterval(transcribeTimerRef.current);
      transcribeTimerRef.current = null;
    }
  }, []);

  const startExtractionTimer = useCallback(() => {
    setExtractionElapsedMs(0);
    setProcessingPercentOverride(null);
    const t0 = Date.now();
    extractionTimerRef.current = setInterval(() => {
      setExtractionElapsedMs(Date.now() - t0);
    }, 150);
  }, []);

  const stopExtractionTimer = useCallback(() => {
    if (extractionTimerRef.current) {
      clearInterval(extractionTimerRef.current);
      extractionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTranscribeTimer();
      stopExtractionTimer();
    };
  }, [stopTranscribeTimer, stopExtractionTimer]);

  const audioUri = !locked && bundle?.attachment?.fileUri ? bundle.attachment.fileUri : null;
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);

  useEffect(() => {
    void (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'doNotMix',
        });
      } catch {
        // Non-fatal playback configuration issue.
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!services || !sessionId || !account?.accountId) {
      return;
    }
    setLoading(true);
    try {
      const bundleData = await services.getSessionBundle(sessionId);
      setBundle(bundleData);
      const latest = bundleData?.transcripts[0] ?? null;
      setTranscript(latest);
      if (latest) {
        setEditText(latest.transcriptText);
        setLoading(false);
      } else {
        const dagbanliSession = isDagbanliTranscriptionLanguage(bundleData?.session.languageHint);
        const manager = WhisperModelManager.getInstance();
        if (dagbanliSession) {
          setLoading(false);
        } else if (manager.getSnapshot().state === 'ready') {
          setLoading(false);
          setBusy(true);
          startTranscribeTimer();
          try {
            const saved = await services.requestTranscription({
              sessionId,
              accountId: account.accountId,
            });
            setTranscript(saved);
            setEditText(saved.transcriptText);
            setProcessingPercentOverride(100);
            await new Promise((resolve) => setTimeout(resolve, 350));
          } catch (caught) {
            setError(mapVoiceServiceError(caught));
          } finally {
            stopTranscribeTimer();
            setProcessingPercentOverride(null);
            setBusy(false);
          }
        } else {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  }, [services, sessionId, account, startTranscribeTimer, stopTranscribeTimer]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const saveManual = async () => {
    if (!services || !account?.accountId || !sessionId || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await services.saveManualTranscript({
        sessionId,
        transcriptText: manualText,
        accountId: account.accountId,
      });
      setTranscript(saved);
      setEditText(saved.transcriptText);
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      setBusy(false);
    }
  };

  const requestTranscription = async () => {
    if (!services || !account?.accountId || !sessionId || locked) {
      return;
    }
    setBusy(true);
    setError(null);
    startTranscribeTimer();
    try {
      const saved = await services.requestTranscription({
        sessionId,
        accountId: account.accountId,
      });
      setTranscript(saved);
      setEditText(saved.transcriptText);
      setProcessingPercentOverride(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
    } finally {
      stopTranscribeTimer();
      setProcessingPercentOverride(null);
      setBusy(false);
    }
  };

  const togglePlayback = () => {
    if (!player.paused) {
      player.pause();
      return;
    }
    if (player.currentTime >= player.duration) {
      player.seekTo(0);
    }
    player.play();
  };

  const confirm = async () => {
    if (!services || !account?.accountId || !transcript || locked) {
      return;
    }
    setError(null);

    const ai = getOfflineAiServices();
    const modelReady = ai.getSnapshot().model.exists;
    const runtimeSupported = ai.getSnapshot().runtime.supported;
    const willExtract = isDev || modelReady || runtimeSupported;

    if (willExtract) {
      setExtractionPhase('extracting');
      startExtractionTimer();
    }
    setBusy(true);

    try {
      const confirmed = await services.confirmTranscript({
        transcriptId: transcript.id,
        accountId: account.accountId,
        transcriptText: editText,
      });
      setTranscript(confirmed);

      if (willExtract) {
        try {
          const { run } = await services.requestExtraction({
            sessionId: sessionId!,
            transcriptId: confirmed.id,
            accountId: account.accountId,
          });

          stopExtractionTimer();
          setProcessingPercentOverride(100);
          await new Promise((resolve) => setTimeout(resolve, 450));
          setExtractionPhase(null);
          setBusy(false);

          router.replace(
            asHref(
              `/(worker)/clients/${clientId}/voice/results?sessionId=${sessionId}&runId=${run.id}`,
            ),
          );
          return;
        } catch (caught) {
          setError(mapVoiceServiceError(caught));
          stopExtractionTimer();
          setExtractionPhase(null);
          setBusy(false);
          return;
        }
      }

      const destination = visitId
        ? `/(worker)/clients/${clientId}/visits/${visitId}`
        : `/(worker)/clients/${clientId}`;
      router.replace(asHref(destination));
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
      stopExtractionTimer();
      setExtractionPhase(null);
      setBusy(false);
    }
  };

  if (loading || !services) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.loading} />
      </AppScreen>
    );
  }

  if (extractionPhase) {
    const extractPercent =
      processingPercentOverride ??
      analysisExtractionPercent(extractionPhase, extractionElapsedMs);
    const step = analysisStepFromPercent(extractPercent);
    return (
      <VoiceToCareShell variant="dark" scrollable={false} testID="voice-transcript-extracting">
        <View style={indicatorStyles.container}>
          <VoiceOrb
            mode="processing"
            processingVariant="analysis"
            progressPercent={extractPercent}
            size={220}
          />
          <AppText variant="label" color="inverse" style={indicatorStyles.title}>
            {voiceStrings.analysisProcessingTitle}
          </AppText>
          <VoiceAnalysisProcessingSteps activeStep={step} />
          <VoiceAnalysisPrivacyNote />
        </View>
      </VoiceToCareShell>
    );
  }

  if (busy) {
    const transcribePercent =
      processingPercentOverride ??
      speechTranscriptionPercent(transcribeElapsedMs, WHISPER_TRANSCRIBE_ESTIMATE_MS);
    const step = processingStepFromPercent(transcribePercent);
    return (
      <VoiceToCareShell variant="dark" scrollable={false} testID="voice-transcript-transcribing">
        <View style={indicatorStyles.container}>
          <VoiceOrb
            mode="processing"
            processingVariant="speech"
            progressPercent={transcribePercent}
            size={220}
          />
          <AppText variant="label" color="inverse" style={indicatorStyles.title}>
            {voiceStrings.transcriptionProcessingTitle}
          </AppText>
          <VoiceProcessingSteps activeStep={step} immersive />
          <VoiceProcessingPrivacyNote immersive />
        </View>
      </VoiceToCareShell>
    );
  }

  const manager = WhisperModelManager.getInstance();
  const modelReady = manager.getSnapshot().state === 'ready';
  const dagbanliSession = isDagbanliTranscriptionLanguage(bundle?.session.languageHint);
  const audioDurationMs =
    bundle?.attachment?.durationMs ??
    (Number.isFinite(player.duration) ? Math.round(player.duration * 1000) : 0);
  const clientName =
    clientContext?.clientName ?? voiceStrings.generalVoiceNoteTitle;
  const categoryLabel =
    clientContext?.categoryLabel ?? voiceStrings.generalVoiceNoteBody;

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      showOnDeviceChip={false}
      rightAction={<VoiceTranscriptHeaderActions />}
      footer={
        !locked && transcript ? (
          <AppButton
            label={voiceStrings.transcriptConfirm}
            onPress={() => void confirm()}
            disabled={busy || editText.trim().length === 0}
            leadingIcon={
              <View style={styles.confirmIconCircle}>
                <AppText variant="caption" color="inverse" style={styles.confirmCheck}>
                  ✓
                </AppText>
              </View>
            }
            trailingIcon={
              <AppText variant="button" color="inverse">
                →
              </AppText>
            }
            testID="voice-transcript-confirm"
          />
        ) : !locked && !transcript ? (
          <AppButton
            label={voiceStrings.transcriptSaveManual}
            onPress={() => void saveManual()}
            disabled={busy || manualText.trim().length === 0}
          />
        ) : undefined
      }
      testID="voice-transcript-screen"
    >
      <View style={voiceTranscriptReviewGapStyle()}>
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

        {!locked ? (
          <VoiceTranscriptClientCard
            clientName={clientName}
            categoryLabel={categoryLabel}
            onChange={() => router.back()}
          />
        ) : null}

        {!locked && transcript ? (
          <>
            <VoiceTranscriptSectionHeader />

            {bundle?.attachment ? (
              <VoiceTranscriptAudioBar
                isPlaying={!player.paused}
                durationMs={audioDurationMs}
                onTogglePlayback={togglePlayback}
              />
            ) : bundle?.session.attachmentId ? (
              <AppText variant="body" color="secondary">
                Audio is linked to this session but the file is not available on this device.
              </AppText>
            ) : null}

            <VoiceTranscriptHowItWorks />

            <VoiceTranscriptEditor
              value={editText}
              onChangeText={setEditText}
              onClear={() => setEditText('')}
            />

            <VoiceTranscriptPrivacyRow />

            {bundle?.session.attachmentId && !dagbanliSession ? (
              <AppButton
                label={voiceStrings.transcriptTranscribeAgain}
                variant="secondary"
                onPress={() => void requestTranscription()}
                disabled={busy || !bundle.attachment}
                testID="voice-transcript-transcribe-again"
              />
            ) : null}
          </>
        ) : null}

        {!locked && !transcript ? (
          <>
            <VoiceTranscriptSectionHeader />
            {dagbanliSession ? (
              <AppText variant="body" color="secondary">
                {voiceStrings.dagbanliTranscriptionUnavailable}
              </AppText>
            ) : null}
            <AppText variant="body">
              {dagbanliSession
                ? voiceStrings.dagbanliTranscriptionNotice
                : modelReady
                  ? 'Offline voice transcription failed to start. Please write the case notes manually below.'
                  : 'Offline voice transcription is unavailable on this build. Write the case notes manually below.'}
            </AppText>
            <VoiceTranscriptEditor
              value={manualText}
              onChangeText={setManualText}
              onClear={() => setManualText('')}
            />
            {(bundle?.attachment || (isDev && !dagbanliSession)) && !dagbanliSession ? (
              <AppButton
                label={voiceStrings.transcriptTranscribeAgain}
                variant="secondary"
                onPress={() => void requestTranscription()}
                disabled={busy}
              />
            ) : null}
          </>
        ) : null}
      </View>
    </VoiceToCareShell>
  );
}

const indicatorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  confirmIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCheck: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
});
