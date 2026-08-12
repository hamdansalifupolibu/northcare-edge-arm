import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText, LoadingState } from '../../../design-system';
import { spacing } from '../../../theme';
import { asHref } from '../../../navigation/href';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { VoiceClientContextCard } from '../components/VoiceClientContextCard';
import {
  VoiceProcessingPrivacyNote,
  VoiceProcessingSteps,
} from '../components/VoiceProcessingSteps';
import { VoiceOrb } from '../components/VoiceOrb';
import { VoiceRecordingSummaryCard } from '../components/VoiceRecordingSummaryCard';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import { VoiceWaveform } from '../components/VoiceWaveform';
import {
  VOICE_MAX_RECORDING_DURATION_MS,
  VOICE_RECORDING_WARNING_DURATION_MS,
} from '../domain/constants';
import {
  saveRecordingPercent,
  processingStepFromPercent,
} from '../domain/voiceProcessingProgress';
import { useVoiceClientContext } from '../hooks/useVoiceClientContext';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { preloadWhisperModel } from '../providers/transcription/WhisperTranscriptionProvider';
import { voiceBasePath } from './VoiceEntryScreen';

const SAVE_ESTIMATE_MS = 2500;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type CapturePhase = 'ready' | 'recording' | 'paused' | 'saving' | 'saved';

export function VoiceRecordScreen() {
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
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const [phase, setPhase] = useState<CapturePhase>('ready');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const autoStopRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locked = authState === 'locked';
  const [saveElapsedMs, setSaveElapsedMs] = useState(0);
  const elapsedMs = recorderState.durationMillis ?? 0;
  const meterLevel =
    recorderState.metering != null
      ? Math.max(0, Math.min(1, (recorderState.metering + 160) / 160))
      : 0.12;

  useEffect(() => {
    void preloadWhisperModel().catch(() => {});
    void (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          shouldPlayInBackground: false,
          interruptionMode: 'doNotMix',
        });
      } catch {
        // Surfaced when recording starts.
      }
    })();
  }, []);

  const startSaveTimer = useCallback(() => {
    setSaveElapsedMs(0);
    const started = Date.now();
    saveTimerRef.current = setInterval(() => {
      setSaveElapsedMs(Date.now() - started);
    }, 150);
  }, []);

  const stopSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const finishRecording = useCallback(async () => {
    if (!services || !account?.accountId || !sessionId || locked) {
      return;
    }
    setPhase('saving');
    setBusy(true);
    setError(null);
    startSaveTimer();
    try {
      await audioRecorder.stop();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const uri = audioRecorder.uri;
      if (!uri) {
        throw new Error('missing-uri');
      }
      await services.saveRecording({
        sessionId,
        tempUri: uri,
        durationMs: audioRecorder.getStatus().durationMillis ?? elapsedMs,
        accountId: account.accountId,
      });
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'doNotMix',
        });
      } catch {
        // Non-fatal.
      }
      setPhase('saved');
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
      setPhase('ready');
    } finally {
      stopSaveTimer();
      setBusy(false);
      autoStopRef.current = false;
    }
  }, [services, account, sessionId, locked, audioRecorder, elapsedMs, startSaveTimer, stopSaveTimer]);

  useEffect(() => {
    if (
      phase === 'recording' &&
      elapsedMs >= VOICE_MAX_RECORDING_DURATION_MS &&
      !autoStopRef.current
    ) {
      autoStopRef.current = true;
      void finishRecording();
    }
  }, [elapsedMs, phase, finishRecording]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && services) {
        const interrupt = services.handleSecureInterrupt({
          reason: 'background',
          sessionLocked: locked,
        });
        if (interrupt.stopRecording && phase === 'recording') {
          void (async () => {
            try {
              await audioRecorder.pause();
              setPhase('paused');
            } catch {
              setPhase('paused');
            }
          })();
        }
      }
    });
    return () => sub.remove();
  }, [services, locked, phase, audioRecorder]);

  useEffect(() => {
    if (locked && services) {
      services.handleSecureInterrupt({ reason: 'lock', sessionLocked: true });
      void (async () => {
        try {
          if (recorderState.isRecording) {
            await audioRecorder.stop();
          }
        } catch {
          // Best-effort stop on lock.
        } finally {
          setPhase('ready');
        }
      })();
    }
  }, [locked, services, audioRecorder, recorderState.isRecording]);

  const startRecording = useCallback(async () => {
    if (locked) {
      return;
    }
    setError(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        setError(voiceStrings.permissionDenied);
        return;
      }
      setPermissionDenied(false);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setPhase('recording');
    } catch {
      setError(voiceStrings.recordFailed);
      setPhase('ready');
    }
  }, [locked, audioRecorder, voiceStrings.permissionDenied, voiceStrings.recordFailed]);

  const pauseRecording = useCallback(async () => {
    try {
      await audioRecorder.pause();
      setPhase('paused');
    } catch {
      setError(voiceStrings.recordFailed);
    }
  }, [audioRecorder, voiceStrings.recordFailed]);

  const resumeRecording = useCallback(() => {
    try {
      audioRecorder.record();
      setPhase('recording');
    } catch {
      setError(voiceStrings.recordFailed);
    }
  }, [audioRecorder, voiceStrings.recordFailed]);

  if (!services) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.loading} />
      </AppScreen>
    );
  }

  if (locked) {
    return (
      <VoiceToCareShell variant="light" onBack={() => router.back()} testID="voice-record-locked">
        <AppText variant="body" color="warning">
          {voiceStrings.lockedBanner}
        </AppText>
      </VoiceToCareShell>
    );
  }

  const nearLimit = elapsedMs >= VOICE_RECORDING_WARNING_DURATION_MS;
  const isDark = phase !== 'ready';
  const elapsedLabel = formatElapsed(elapsedMs);
  const savePercent = saveRecordingPercent(saveElapsedMs, SAVE_ESTIMATE_MS);
  const saveStep = processingStepFromPercent(savePercent);

  const footer = (
    <View style={styles.footerActions}>
      {phase === 'ready' ? (
        <>
          <AppButton label={voiceStrings.recordStart} onPress={() => void startRecording()} />
          <AppButton
            label={voiceStrings.manualTranscriptCta}
            variant="secondary"
            onPress={() =>
              router.push(
                asHref(`${voiceBasePath(clientId, visitId)}/transcript?sessionId=${sessionId}&manual=1`),
              )
            }
          />
        </>
      ) : null}
      {phase === 'recording' ? (
        <>
          <AppButton
            label={voiceStrings.recordPause}
            variant="secondary"
            onPress={() => void pauseRecording()}
          />
          <AppButton
            label={voiceStrings.finishRecording}
            onPress={() => void finishRecording()}
            disabled={busy}
          />
        </>
      ) : null}
      {phase === 'paused' ? (
        <>
          <AppButton label={voiceStrings.recordResume} onPress={resumeRecording} />
          <AppButton
            label={voiceStrings.finishRecording}
            onPress={() => void finishRecording()}
            disabled={busy}
          />
        </>
      ) : null}
      {phase === 'saved' ? (
        <>
          <AppButton
            label={voiceStrings.reviewTranscriptCta}
            onPress={() =>
              router.push(asHref(`${voiceBasePath(clientId, visitId)}/transcript?sessionId=${sessionId}`))
            }
          />
          <AppButton
            label={voiceStrings.recordAgainCta}
            variant="secondary"
            onPress={() => setPhase('ready')}
          />
        </>
      ) : null}
    </View>
  );

  return (
    <VoiceToCareShell
      variant={isDark ? 'dark' : 'light'}
      onBack={() => router.back()}
      scrollable={phase !== 'saving'}
      footer={phase === 'saving' ? undefined : footer}
      testID="voice-record-screen"
    >
      <View style={styles.body}>
        {clientContext && phase === 'ready' ? (
          <VoiceClientContextCard
            clientName={clientContext.clientName}
            categoryLabel={clientContext.categoryLabel}
            consentConfirmed
          />
        ) : null}

        <View style={styles.centerBlock}>
          {phase === 'saving' ? (
            <>
              <VoiceOrb mode="processing" processingVariant="save" progressPercent={savePercent} size={220} />
              <AppText variant="label" color="inverse" style={styles.statusTitle}>
                {voiceStrings.processingTitle}
              </AppText>
              <VoiceProcessingSteps activeStep={saveStep} />
              <VoiceProcessingPrivacyNote />
            </>
          ) : (
            <>
              <VoiceOrb
                mode={
                  phase === 'recording'
                    ? 'listening'
                    : phase === 'paused'
                      ? 'paused'
                      : phase === 'saved'
                        ? 'saved'
                        : 'idle'
                }
                level={meterLevel}
              />
              <RecordingIndicator
                state={
                  phase === 'recording'
                    ? 'recording'
                    : phase === 'paused'
                      ? 'paused'
                      : 'ready'
                }
                elapsedLabel={elapsedLabel}
                inverse={isDark}
              />
              {phase === 'recording' ? (
                <AppText variant="label" color={isDark ? 'inverse' : 'primary'}>
                  {voiceStrings.listeningStatus}
                </AppText>
              ) : null}
            </>
          )}
        </View>

        {(phase === 'recording' || phase === 'paused') && !busy ? (
          <VoiceWaveform active={phase === 'recording'} level={meterLevel} immersive={isDark} />
        ) : null}

        {phase === 'saved' ? (
          <VoiceRecordingSummaryCard durationLabel={elapsedLabel} />
        ) : null}

        {nearLimit && phase === 'recording' ? (
          <AppText variant="caption" color="warning" accessibilityRole="text">
            {voiceStrings.recordNearLimit}
          </AppText>
        ) : null}
        {permissionDenied ? (
          <AppText variant="body" color="urgent">
            {voiceStrings.permissionBlockedHint}
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
  centerBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  statusTitle: {
    textAlign: 'center',
  },
  footerActions: {
    gap: spacing.sm,
  },
});
