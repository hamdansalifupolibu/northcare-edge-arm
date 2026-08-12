export type { WorkspaceId } from '../../auth/domain/workspaces';

export {
  isWorkspaceId,
  workspaceRole,
  resolveSingleWorkspace,
  resolveActiveWorkspaceForSetup,
  requiresWorkspaceSelection,
} from '../../auth/domain/workspaces';

export { workspaceForRole } from '../../auth/domain/roles';
