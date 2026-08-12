import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { createExpoOfflineAiDownloader } from '../provisioning/expoOfflineAiDownloader';
import { createLlamaRnRuntime } from '../runtime/llamaRuntime';
import { createExpoOfflineAiFileStore } from '../storage/expoOfflineAiFileStore';
import { createOfflineAiLifecycle, type OfflineAiLifecycle } from './offlineAiLifecycle';

let cached: OfflineAiLifecycle | null = null;

export function createOfflineAiServices(): OfflineAiLifecycle {
  const config = getAppConfig();
  return createOfflineAiLifecycle({
    fileStore: createExpoOfflineAiFileStore(),
    downloader: createExpoOfflineAiDownloader(),
    runtime: createLlamaRnRuntime(),
    appEnv: config.appEnv,
    async isNetworkOnline() {
      const state = await NetInfo.fetch();
      if (typeof state.isConnected === 'boolean') {
        return state.isConnected && state.isInternetReachable !== false;
      }
      return null;
    },
    async getDeviceInfo() {
      return {
        model: Platform.OS === 'android' ? 'android-device' : Platform.OS,
        androidVersion: Platform.OS === 'android' ? String(Platform.Version) : null,
      };
    },
  });
}

export function getOfflineAiServices(): OfflineAiLifecycle {
  if (!cached) {
    cached = createOfflineAiServices();
  }
  return cached;
}

/** Test helper */
export function resetOfflineAiServicesCache(): void {
  cached = null;
}
