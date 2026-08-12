import type { WorkspaceId } from '../../auth/domain/workspaces';

/**
 * Workspace switching is owned by AuthSessionProvider (clears unsafe history,
 * refreshes roles when online, persists activeWorkspace in the session envelope).
 */
export type SwitchWorkspaceInput = {
  readonly workspace: WorkspaceId;
};
