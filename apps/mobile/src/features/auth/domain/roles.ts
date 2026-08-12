import type { AuthRole } from './types';
import type { WorkspaceId } from './workspaces';

/** Server role identifiers returned by the NorthCare API. */
export type ServerRole = 'worker' | 'admin';

export function mapServerRoleToMobile(role: string): AuthRole | null {
  if (role === 'worker') {
    return 'worker';
  }
  if (role === 'admin' || role === 'administrator') {
    return 'administrator';
  }
  return null;
}

export function mapMobileRoleToServer(role: AuthRole): ServerRole {
  return role === 'administrator' ? 'admin' : 'worker';
}

export function mapServerRolesToMobile(roles: readonly string[]): AuthRole[] {
  const mapped = roles
    .map((role) => mapServerRoleToMobile(role))
    .filter((role): role is AuthRole => role !== null);
  return [...new Set(mapped)];
}

export function hasMobileRole(roles: readonly AuthRole[], role: AuthRole): boolean {
  return roles.includes(role);
}

export function rolePermitsWorkspace(
  roles: readonly AuthRole[],
  workspace: WorkspaceId,
): boolean {
  if (workspace === 'worker') {
    return hasMobileRole(roles, 'worker');
  }
  return hasMobileRole(roles, 'administrator');
}

export function workspaceForRole(role: AuthRole): WorkspaceId {
  return role === 'administrator' ? 'administration' : 'worker';
}
