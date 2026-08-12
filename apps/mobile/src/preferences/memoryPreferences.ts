import type { AppPreferencesRepository } from './AppPreferencesRepository';
import { isOnboardingCompleteForVersion } from './AppPreferencesRepository';
import { CURRENT_ONBOARDING_VERSION } from './onboardingVersion';
import type { AppPreferences, WorkspacePreference } from './types';

/**
 * In-memory preferences for unit tests.
 */
export function createMemoryPreferencesRepository(
  initial: Partial<AppPreferences> = {},
): AppPreferencesRepository {
  let state: AppPreferences = {
    onboardingVersionCompleted: initial.onboardingVersionCompleted ?? null,
    selectedWorkspace: initial.selectedWorkspace ?? null,
  };

  return {
    async getPreferences() {
      return state;
    },
    async getOnboardingStatus(currentVersion = CURRENT_ONBOARDING_VERSION) {
      return {
        completedVersion: state.onboardingVersionCompleted,
        completed: isOnboardingCompleteForVersion(
          state.onboardingVersionCompleted,
          currentVersion,
        ),
      };
    },
    async setOnboardingCompleted(version = CURRENT_ONBOARDING_VERSION) {
      state = { ...state, onboardingVersionCompleted: version };
    },
    async resetOnboardingForDevelopment() {
      state = { onboardingVersionCompleted: null, selectedWorkspace: null };
    },
    async getSelectedWorkspace() {
      return state.selectedWorkspace;
    },
    async setSelectedWorkspace(workspace: WorkspacePreference) {
      state = { ...state, selectedWorkspace: workspace };
    },
    async clearSelectedWorkspace() {
      state = { ...state, selectedWorkspace: null };
    },
  };
}
