import { Platform } from 'react-native';

export const OFFLINE_AI_ANDROID_ASSET_DIR = 'offline-ai-models';

/**
 * Android APK asset URI for a bundled GGUF (copied by withBundledOfflineAiModel at prebuild).
 * Returns null on unsupported platforms.
 */
export function resolveBundledOfflineAiAssetUri(filename: string): string | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  return `file:///android_asset/${OFFLINE_AI_ANDROID_ASSET_DIR}/${filename}`;
}
