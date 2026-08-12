import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppPreferencesRepository } from './AppPreferencesRepository';
import { isOnboardingCompleteForVersion } from './AppPreferencesRepository';
import { CURRENT_ONBOARDING_VERSION } from './onboardingVersion';
import type { AppPreferences, WorkspacePreference } from './types';

const KEYS = {
  onboardingVersion: '@northcare/onboardingVersionCompleted',
  workspace: '@northcare/selectedWorkspace',
} as const;

function parseWorkspace(value: string | null): WorkspacePreference | null {
  if (value === 'worker' || value === 'administrator') {
    return value;
  }
  return null;
}

function parseVersion(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Non-sensitive preference storage via AsyncStorage.
 * Never store passwords, PINs, tokens, or health information here.
 */
export function createAsyncStoragePreferencesRepository(): AppPreferencesRepository {
  return {
    async getPreferences(): Promise<AppPreferences> {
      const [versionRaw, workspaceRaw] = await AsyncStorage.multiGet([
        KEYS.onboardingVersion,
        KEYS.workspace,
      ]);
      return {
        onboardingVersionCompleted: parseVersion(versionRaw?.[1] ?? null),
        selectedWorkspace: parseWorkspace(workspaceRaw?.[1] ?? null),
      };
    },

    async getOnboardingStatus(currentVersion = CURRENT_ONBOARDING_VERSION) {
      const raw = await AsyncStorage.getItem(KEYS.onboardingVersion);
      const completedVersion = parseVersion(raw);
      return {
        completedVersion,
        completed: isOnboardingCompleteForVersion(completedVersion, currentVersion),
      };
    },

    async setOnboardingCompleted(version = CURRENT_ONBOARDING_VERSION) {
      await AsyncStorage.setItem(KEYS.onboardingVersion, String(version));
    },

    async resetOnboardingForDevelopment() {
      await AsyncStorage.multiRemove([KEYS.onboardingVersion, KEYS.workspace]);
    },

    async getSelectedWorkspace() {
      return parseWorkspace(await AsyncStorage.getItem(KEYS.workspace));
    },

    async setSelectedWorkspace(workspace) {
      await AsyncStorage.setItem(KEYS.workspace, workspace);
    },

    async clearSelectedWorkspace() {
      await AsyncStorage.removeItem(KEYS.workspace);
    },
  };
}
