import Constants from 'expo-constants';

/**
 * Hackathon demo builds auto-copy the bundled GGUF on first launch when enabled.
 * Default on in development; set EXPO_PUBLIC_BUNDLED_OFFLINE_AI=false to disable.
 */
export function isBundledOfflineAiEnabled(): boolean {
  if (!__DEV__) {
    return true;
  }
  const extra = Constants.expoConfig?.extra as
    | { readonly bundledOfflineAi?: unknown }
    | undefined;
  return extra?.bundledOfflineAi !== false;
}
