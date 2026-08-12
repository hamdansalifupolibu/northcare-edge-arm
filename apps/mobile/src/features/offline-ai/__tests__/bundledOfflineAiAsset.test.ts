import { Platform } from 'react-native';

import {
  OFFLINE_AI_ANDROID_ASSET_DIR,
  resolveBundledOfflineAiAssetUri,
} from '../provisioning/bundledOfflineAiAsset';

describe('bundledOfflineAiAsset', () => {
  it('returns android asset URI for bundled model filename', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    expect(resolveBundledOfflineAiAssetUri('qwen2.5-0.5b-instruct-q4_k_m.gguf')).toBe(
      `file:///android_asset/${OFFLINE_AI_ANDROID_ASSET_DIR}/qwen2.5-0.5b-instruct-q4_k_m.gguf`,
    );
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('returns null on non-android platforms', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    expect(resolveBundledOfflineAiAssetUri('model.gguf')).toBeNull();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });
});
