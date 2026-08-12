import { getAppConfig } from '../config/appConfig';
import { rolePermitsWorkspace } from '../features/auth/domain/roles';
import type { AuthRole, AuthSessionState } from '../features/auth/domain/types';
import type { WorkspaceId } from '../features/auth/domain/workspaces';

export type RouteAccessLevel =
  | 'public'
  | 'development-only'
  | 'future-worker-auth'
  | 'future-admin-auth'
  | 'auth-setup'
  | 'auth-locked'
  | 'auth-workspace-selection'
  | 'protected-worker'
  | 'protected-admin';

export type RouteAccessDecision = {
  readonly allowed: boolean;
  readonly reason: string;
  readonly redirectTo?: string;
};

export type AuthAccessContext = {
  readonly diagnosticsEnabled?: boolean;
  readonly authState?: AuthSessionState;
  readonly role?: AuthRole | null;
  readonly availableRoles?: readonly AuthRole[];
  readonly activeWorkspace?: WorkspaceId | null;
};

function isUnlocked(authState: AuthSessionState): boolean {
  return authState === 'authenticated';
}

function workspaceGuardRedirect(activeWorkspace: WorkspaceId | null | undefined): string {
  if (activeWorkspace === 'administration') {
    return '/(admin)';
  }
  if (activeWorkspace === 'worker') {
    return '/(worker)';
  }
  return '/(entry)/session-workspace';
}

/**
 * Central route-access policy with Stage 16 workspace isolation.
 */
export function evaluateRouteAccess(
  accessLevel: RouteAccessLevel,
  options: AuthAccessContext = {},
): RouteAccessDecision {
  const diagnosticsEnabled =
    options.diagnosticsEnabled ?? getAppConfig().diagnosticsEnabled;
  const authState = options.authState ?? 'signedOut';
  const role = options.role ?? null;
  const availableRoles = options.availableRoles ?? (role ? [role] : []);
  const activeWorkspace = options.activeWorkspace ?? null;

  switch (accessLevel) {
    case 'public':
    case 'future-worker-auth':
    case 'future-admin-auth':
      return { allowed: true, reason: 'public-or-auth-boundary' };

    case 'auth-setup':
      if (authState === 'firstTimeSetupRequired') {
        return { allowed: true, reason: 'first-time-setup' };
      }
      return {
        allowed: false,
        reason: 'setup-not-active',
        redirectTo: '/',
      };

    case 'auth-workspace-selection':
      if (authState === 'workspaceSelectionRequired') {
        return { allowed: true, reason: 'workspace-selection-required' };
      }
      return {
        allowed: false,
        reason: 'workspace-selection-not-active',
        redirectTo: workspaceGuardRedirect(activeWorkspace),
      };

    case 'auth-locked':
      if (authState === 'locked' || authState === 'sessionExpired') {
        return { allowed: true, reason: 'locked-session' };
      }
      return {
        allowed: false,
        reason: 'not-locked',
        redirectTo: '/',
      };

    case 'development-only':
      if (diagnosticsEnabled) {
        return { allowed: true, reason: 'development-diagnostics' };
      }
      return {
        allowed: false,
        reason: 'development-only-blocked-in-production',
        redirectTo: '/',
      };

    case 'protected-worker': {
      if (authState === 'locked' && rolePermitsWorkspace(availableRoles, 'worker')) {
        return {
          allowed: false,
          reason: 'locked',
          redirectTo: '/(auth)/unlock',
        };
      }
      if (!isUnlocked(authState)) {
        return {
          allowed: false,
          reason: 'worker-auth-required',
          redirectTo: '/(auth)/worker-login',
        };
      }
      if (!rolePermitsWorkspace(availableRoles, 'worker')) {
        return {
          allowed: false,
          reason: 'worker-role-required',
          redirectTo: '/(auth)/admin-login',
        };
      }
      if (activeWorkspace !== 'worker') {
        return {
          allowed: false,
          reason: 'wrong-workspace',
          redirectTo: workspaceGuardRedirect(activeWorkspace),
        };
      }
      return { allowed: true, reason: 'authenticated-worker' };
    }

    case 'protected-admin': {
      if (authState === 'locked' && rolePermitsWorkspace(availableRoles, 'administration')) {
        return {
          allowed: false,
          reason: 'locked',
          redirectTo: '/(auth)/unlock',
        };
      }
      if (!isUnlocked(authState)) {
        return {
          allowed: false,
          reason: 'admin-auth-required',
          redirectTo: '/(auth)/admin-login',
        };
      }
      if (!rolePermitsWorkspace(availableRoles, 'administration')) {
        return {
          allowed: false,
          reason: 'administrator-role-required',
          redirectTo: '/(auth)/worker-login',
        };
      }
      if (activeWorkspace !== 'administration') {
        return {
          allowed: false,
          reason: 'wrong-workspace',
          redirectTo: workspaceGuardRedirect(activeWorkspace),
        };
      }
      return { allowed: true, reason: 'authenticated-administrator' };
    }

    default: {
      const _exhaustive: never = accessLevel;
      return { allowed: false, reason: String(_exhaustive), redirectTo: '/' };
    }
  }
}

export function isDevelopmentRouteAllowed(
  diagnosticsEnabled: boolean = getAppConfig().diagnosticsEnabled,
): boolean {
  return evaluateRouteAccess('development-only', { diagnosticsEnabled }).allowed;
}
