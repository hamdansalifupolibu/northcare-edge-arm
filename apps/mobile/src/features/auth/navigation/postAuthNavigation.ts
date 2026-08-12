import type { LocalSessionEnvelope } from '../domain/sessionEnvelope';
import { requiresWorkspaceSelection } from '../domain/workspaces';

export function resolveAuthenticatedHomeRoute(session: LocalSessionEnvelope): string {
  if (session.activeWorkspace === 'administration') {
    return '/(admin)';
  }
  if (session.activeWorkspace === 'worker') {
    return '/(worker)';
  }
  if (requiresWorkspaceSelection(session.permittedWorkspaces)) {
    return '/(entry)/session-workspace';
  }
  const only = session.permittedWorkspaces[0];
  if (only === 'administration') {
    return '/(admin)';
  }
  return '/(worker)';
}
