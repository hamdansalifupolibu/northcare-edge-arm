import { createAsyncStoragePreferencesRepository } from './asyncStoragePreferences';
import type { AppPreferencesRepository } from './AppPreferencesRepository';

export type { AppPreferencesRepository } from './AppPreferencesRepository';
export {
  isOnboardingCompleteForVersion,
} from './AppPreferencesRepository';
export { CURRENT_ONBOARDING_VERSION } from './onboardingVersion';
export { createMemoryPreferencesRepository } from './memoryPreferences';
export type { AppPreferences, OnboardingStatus, WorkspacePreference } from './types';

let defaultRepository: AppPreferencesRepository | null = null;

export function getAppPreferencesRepository(): AppPreferencesRepository {
  if (defaultRepository === null) {
    defaultRepository = createAsyncStoragePreferencesRepository();
  }
  return defaultRepository;
}

/** Test helper */
export function setAppPreferencesRepositoryForTests(
  repository: AppPreferencesRepository | null,
): void {
  defaultRepository = repository;
}
