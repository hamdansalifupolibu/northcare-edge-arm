import { setAudioModeAsync } from 'expo-audio';

/**
 * Foreground capture/playback only. Background recording intentionally disabled.
 */
export async function configureForegroundVoiceAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  });
}

export async function configurePlaybackOnlyAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  });
}
