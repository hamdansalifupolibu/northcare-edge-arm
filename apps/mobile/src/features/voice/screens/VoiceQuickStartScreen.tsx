import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText, LoadingState } from '../../../design-system';
import { asHref } from '../../../navigation/href';
import { spacing } from '../../../theme';
import { useLanguage } from '../../../i18n/LanguageProvider';
import { useRequestLanguage } from '../../../i18n/LanguageDisclaimerProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import { RecordingIndicator } from '../components/RecordingIndicator';
import {
  VoiceTranscriptClientCard,
  VoiceTranscriptHeaderActions,
} from '../components/VoiceTranscriptReviewUI';
import { VoiceViewRecordingsCard } from '../components/VoiceViewRecordingsCard';
import {
  VoiceProcessingPrivacyNote,
  VoiceProcessingSteps,
} from '../components/VoiceProcessingSteps';
import { VoiceOrb } from '../components/VoiceOrb';
import {
  VoiceLanguageSelector,
  VoiceToCareShell,
} from '../components/VoiceToCareShell';
import { VoiceWaveform } from '../components/VoiceWaveform';
import {
  VOICE_MAX_RECORDING_DURATION_MS,
  VOICE_RECORDING_WARNING_DURATION_MS,
} from '../domain/constants';
import {
  saveRecordingPercent,
  processingStepFromPercent,
} from '../domain/voiceProcessingProgress';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';
import { preloadWhisperModel } from '../providers/transcription/WhisperTranscriptionProvider';

const CONSENT_STORAGE_KEY = '@northcare/voice-consent-accepted';
const SAVE_ESTIMATE_MS = 2500;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type Phase =
  | 'loading'
  | 'consent'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'saving'
  | 'done';

export function VoiceQuickStartScreen() {
  const voiceStrings = useVoiceStrings();
  const { language, getLanguageInfo, supportedLanguages } = useLanguage();
  const { requestLanguage } = useRequestLanguage();
  const router = useRouter();
  const { account, authState, touchActivity } = useAuthSession();
  const services = useVoiceServices();
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saveElapsedMs, setSaveElapsedMs] = useState(0);
  const autoStopRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locked = authState === 'locked';
  const elapsedMs = recorderState.durationMillis ?? 0;
  const meterLevel =
    recorderState.metering != null
      ? Math.max(0, Math.min(1, (recorderState.metering + 160) / 160))
      : 0.12;
  const languageInfo = getLanguageInfo(language);

  useEffect(() => {
    touchActivity();
    void (async () => {
      try {
        const accepted = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
        setPhase(accepted === 'true' ? 'ready' : 'consent');
      } catch {
        setPhase('consent');
      }
    })();
  }, [touchActivity]);

  useEffect(() => {
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
    void preloadWhisperModel().catch(() => {});
    return () => {
      void setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
    };
  }, []);

  const acceptConsent = useCallback(async () => {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      setPhase('ready');
    } catch {
      setError('Could not save consent preference.');
    }
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
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      await audioRecorder.prepareToRecordAsync({
        ...RecordingPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      audioRecorder.record();
      setPhase('recording');
    } catch {
      setError(voiceStrings.recordFailed);
    }
  }, [locked, audioRecorder, voiceStrings.permissionDenied, voiceStrings.recordFailed]);

  const pauseRecording = useCallback(async () => {
    try {
      await audioRecorder.pause();
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      setPhase('paused');
    } catch {
      setError(voiceStrings.recordFailed);
    }
  }, [audioRecorder, voiceStrings.recordFailed]);

  const resumeRecording = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      audioRecorder.record();
      setPhase('recording');
    } catch {
      setError(voiceStrings.recordFailed);
    }
  }, [audioRecorder, voiceStrings.recordFailed]);

  const stopAndNavigate = useCallback(async () => {
    if (!services || !account?.accountId || locked) {
      return;
    }
    setPhase('saving');
    setError(null);
    startSaveTimer();
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      const uri = audioRecorder.uri;
      if (!uri) {
        throw new Error('missing-uri');
      }
      const tempFileObj = new File(uri);
      const safeDir = new Directory(Paths.document, 'voice_temp');
      if (!safeDir.exists) {
        safeDir.create({ intermediates: true, idempotent: true });
      }
      const safeFile = new File(safeDir, `temp_recording_${Date.now()}.m4a`);
      tempFileObj.copy(safeFile);
      const durationMs = audioRecorder.getStatus().durationMillis ?? elapsedMs;
      setSaveElapsedMs(SAVE_ESTIMATE_MS);
      router.push(
        `/(worker)/clients?mode=voice-assign&tempUri=${encodeURIComponent(safeFile.uri)}&durationMs=${durationMs}`,
      );
    } catch (caught) {
      setError(mapVoiceServiceError(caught));
      setPhase('ready');
    } finally {
      stopSaveTimer();
      autoStopRef.current = false;
    }
  }, [
    services,
    account,
    locked,
    audioRecorder,
    elapsedMs,
    router,
    startSaveTimer,
    stopSaveTimer,
  ]);

  useEffect(() => {
    if (
      phase === 'recording' &&
      elapsedMs >= VOICE_MAX_RECORDING_DURATION_MS &&
      !autoStopRef.current
    ) {
      autoStopRef.current = true;
      void stopAndNavigate();
    }
  }, [elapsedMs, phase, stopAndNavigate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && phase === 'recording') {
        void (async () => {
          try {
            await audioRecorder.pause();
            setPhase('paused');
          } catch {
            setPhase('paused');
          }
        })();
      }
    });
    return () => sub.remove();
  }, [phase, audioRecorder]);

  useEffect(() => {
    if (locked && (phase === 'recording' || phase === 'paused')) {
      void (async () => {
        try {
          await audioRecorder.stop();
        } catch {
          // Best-effort stop on lock.
        } finally {
          setPhase('ready');
        }
      })();
    }
  }, [locked, phase, audioRecorder]);

  const cycleLanguage = useCallback(() => {
    const currentIndex = supportedLanguages.findIndex((item) => item.code === language);
    const next = supportedLanguages[(currentIndex + 1) % supportedLanguages.length];
    if (next) {
      requestLanguage(next.code);
    }
  }, [language, requestLanguage, supportedLanguages]);

  const openRecordings = useCallback(() => {
    router.push(asHref('/(worker)/voice/recordings'));
  }, [router]);

  const headerActions = <VoiceTranscriptHeaderActions />;

  if (phase === 'loading' || !services) {
    return (
      <AppScreen>
        <LoadingState message={voiceStrings.loading} />
      </AppScreen>
    );
  }

  if (locked) {
    return (
      <VoiceToCareShell variant="light" onBack={() => router.back()} testID="voice-quick-locked">
        <AppText variant="body" color="warning">
          {voiceStrings.lockedBanner}
        </AppText>
      </VoiceToCareShell>
    );
  }

  if (phase === 'consent') {
    const footer = (
      <View style={styles.footerActions}>
        <AppButton
          label={voiceStrings.consentRecorded}
          onPress={() => void acceptConsent()}
          testID="voice-quick-accept-consent"
        />
        <AppButton label="Go back" variant="tertiary" onPress={() => router.back()} />
      </View>
    );
    return (
      <VoiceToCareShell
        variant="light"
        onBack={() => router.back()}
        showOnDeviceChip={false}
        rightAction={headerActions}
        footer={footer}
        testID="voice-quick-consent"
      >
        <View style={styles.body}>
          <VoiceTranscriptClientCard
            clientName={voiceStrings.generalVoiceNoteTitle}
            categoryLabel={voiceStrings.generalVoiceNoteBody}
          />
          <AppText variant="headingSmall">{voiceStrings.consentTitle}</AppText>
          <AppText variant="body">{voiceStrings.consentBody}</AppText>
          {error ? (
            <AppText variant="body" color="urgent">
              {error}
            </AppText>
          ) : null}
        </View>
      </VoiceToCareShell>
    );
  }

  const nearLimit = elapsedMs >= VOICE_RECORDING_WARNING_DURATION_MS;
  const isDark = phase === 'recording' || phase === 'paused' || phase === 'saving';
  const elapsedLabel = formatElapsed(elapsedMs);
  const savePercent = saveRecordingPercent(saveElapsedMs, SAVE_ESTIMATE_MS);
  const saveStep = processingStepFromPercent(savePercent);

  const footer =
    phase === 'saving' ? undefined : (
      <View style={styles.footerActions}>
        {phase === 'ready' ? (
          <>
            <AppButton
              label={voiceStrings.recordStart}
              onPress={() => void startRecording()}
              testID="voice-quick-start-recording"
            />
            <AppButton label="Go back" variant="tertiary" onPress={() => router.back()} />
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
              onPress={() => void stopAndNavigate()}
              testID="voice-quick-stop"
            />
          </>
        ) : null}
        {phase === 'paused' ? (
          <>
            <AppButton label={voiceStrings.recordResume} onPress={() => void resumeRecording()} />
            <AppButton
              label={voiceStrings.finishRecording}
              onPress={() => void stopAndNavigate()}
              testID="voice-quick-stop"
            />
          </>
        ) : null}
      </View>
    );

  return (
    <VoiceToCareShell
      variant={isDark ? 'dark' : 'light'}
      onBack={() => router.back()}
      showOnDeviceChip={false}
      rightAction={headerActions}
      scrollable={phase !== 'saving'}
      footer={footer}
      testID="voice-quick-record"
    >
      <View style={styles.body}>
        {phase === 'ready' ? (
          <>
            <VoiceTranscriptClientCard
              clientName={voiceStrings.generalVoiceNoteTitle}
              categoryLabel={voiceStrings.generalVoiceNoteBody}
            />
            <VoiceLanguageSelector languageLabel={languageInfo.nativeName} onPress={cycleLanguage} />
            <VoiceViewRecordingsCard onPress={openRecordings} />
          </>
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
                      : 'idle'
                }
                level={meterLevel}
                size={220}
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
              {phase === 'ready' ? (
                <AppText variant="body" color="secondary" style={styles.readyHint}>
                  {voiceStrings.quickStartBody}
                </AppText>
              ) : null}
            </>
          )}
        </View>

        {(phase === 'recording' || phase === 'paused') ? (
          <VoiceWaveform active={phase === 'recording'} level={meterLevel} immersive={isDark} />
        ) : null}

        {nearLimit && phase === 'recording' ? (
          <AppText variant="caption" color="warning">
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
  readyHint: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footerActions: {
    gap: spacing.sm,
  },
});
