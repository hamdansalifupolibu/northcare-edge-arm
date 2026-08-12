export type WorkspaceId = 'worker' | 'administration';

export function isWorkspaceId(value: unknown): value is WorkspaceId {
  return value === 'worker' || value === 'administration';
}

export function workspaceRole(workspace: WorkspaceId): 'worker' | 'administrator' {
  return workspace === 'administration' ? 'administrator' : 'worker';
}

export function resolveSingleWorkspace(
  permitted: readonly WorkspaceId[],
): WorkspaceId | null {
  if (permitted.length === 1) {
    return permitted[0] ?? null;
  }
  return null;
}

/**
 * Prefer the workspace chosen at launch/sign-in when it is still permitted.
 * Dual-role accounts otherwise keep activeWorkspace null until explicit selection.
 */
export function resolveActiveWorkspaceForSetup(
  permitted: readonly WorkspaceId[],
  preferredWorkspace: WorkspaceId | null,
): WorkspaceId | null {
  if (preferredWorkspace !== null && permitted.includes(preferredWorkspace)) {
    return preferredWorkspace;
  }
  return resolveSingleWorkspace(permitted);
}

export function requiresWorkspaceSelection(permitted: readonly WorkspaceId[]): boolean {
  return permitted.length > 1;
}
