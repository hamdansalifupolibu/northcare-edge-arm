export type WorkspacePreference = 'worker' | 'administrator';

export type OnboardingStatus = {
  readonly completedVersion: number | null;
  readonly completed: boolean;
};

export type AppPreferences = {
  readonly onboardingVersionCompleted: number | null;
  readonly selectedWorkspace: WorkspacePreference | null;
};
