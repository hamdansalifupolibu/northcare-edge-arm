import {
  mapServerRoleToMobile,
  mapServerRolesToMobile,
  workspaceForRole,
} from '../../auth/domain/roles';
import {
  requiresWorkspaceSelection,
  resolveActiveWorkspaceForSetup,
  resolveSingleWorkspace,
} from '../domain/workspaces';

describe('multi-role session helpers', () => {
  it('maps server admin role to mobile administrator', () => {
    expect(mapServerRoleToMobile('admin')).toBe('administrator');
    expect(mapServerRoleToMobile('worker')).toBe('worker');
  });

  it('derives available roles from server payload', () => {
    expect(mapServerRolesToMobile(['worker', 'admin'])).toEqual(['worker', 'administrator']);
  });

  it('requires workspace selection for dual-role accounts when no preference exists', () => {
    expect(requiresWorkspaceSelection(['worker', 'administration'])).toBe(true);
    expect(resolveSingleWorkspace(['worker'])).toBe('worker');
    expect(resolveSingleWorkspace(['worker', 'administration'])).toBeNull();
    expect(
      resolveActiveWorkspaceForSetup(['worker', 'administration'], null),
    ).toBeNull();
  });

  it('honours launch/sign-in workspace preference during setup for dual-role accounts', () => {
    expect(workspaceForRole('worker')).toBe('worker');
    expect(workspaceForRole('administrator')).toBe('administration');
    expect(
      resolveActiveWorkspaceForSetup(
        ['worker', 'administration'],
        workspaceForRole('worker'),
      ),
    ).toBe('worker');
    expect(
      resolveActiveWorkspaceForSetup(
        ['worker', 'administration'],
        workspaceForRole('administrator'),
      ),
    ).toBe('administration');
    expect(
      resolveActiveWorkspaceForSetup(['worker'], workspaceForRole('administrator')),
    ).toBe('worker');
  });
});
