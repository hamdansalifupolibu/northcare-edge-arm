import type { AppPreferences, OnboardingStatus, WorkspacePreference } from './types';
import { CURRENT_ONBOARDING_VERSION } from './onboardingVersion';

export type AppPreferencesRepository = {
  getPreferences(): Promise<AppPreferences>;
  getOnboardingStatus(currentVersion?: number): Promise<OnboardingStatus>;
  setOnboardingCompleted(version?: number): Promise<void>;
  resetOnboardingForDevelopment(): Promise<void>;
  getSelectedWorkspace(): Promise<WorkspacePreference | null>;
  setSelectedWorkspace(workspace: WorkspacePreference): Promise<void>;
  clearSelectedWorkspace(): Promise<void>;
};

export function isOnboardingCompleteForVersion(
  completedVersion: number | null,
  currentVersion: number = CURRENT_ONBOARDING_VERSION,
): boolean {
  return completedVersion !== null && completedVersion >= currentVersion;
}
