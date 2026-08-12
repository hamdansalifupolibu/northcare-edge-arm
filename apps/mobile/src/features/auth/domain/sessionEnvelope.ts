import type { AuthRole } from './types';
import type { WorkspaceId } from './workspaces';
import { isWorkspaceId } from './workspaces';

export const SESSION_ENVELOPE_SCHEMA_VERSION = 2;

export type LocalSessionEnvelope = {
  readonly schemaVersion: number;
  readonly accountId: string;
  readonly role: AuthRole;
  readonly availableRoles: readonly AuthRole[];
  readonly permittedWorkspaces: readonly WorkspaceId[];
  readonly activeWorkspace: WorkspaceId | null;
  readonly displayName: string;
  readonly facilityId: string;
  readonly facilityName: string;
  readonly organisationId: string;
  readonly lastRemoteVerificationAt: string;
  readonly offlineAccessPolicyVersion: number;
  readonly localSetupCompletedAt: string;
  readonly biometricEnabled: boolean;
  readonly sessionState: 'ready' | 'locked';
};

function isAuthRole(value: unknown): value is AuthRole {
  return value === 'worker' || value === 'administrator';
}

function isWorkspaceList(value: unknown): value is WorkspaceId[] {
  return Array.isArray(value) && value.every((item) => isWorkspaceId(item));
}

function isRoleList(value: unknown): value is AuthRole[] {
  return Array.isArray(value) && value.every((item) => isAuthRole(item));
}

export function isValidSessionEnvelope(value: unknown): value is LocalSessionEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === SESSION_ENVELOPE_SCHEMA_VERSION &&
    typeof v.accountId === 'string' &&
    isAuthRole(v.role) &&
    isRoleList(v.availableRoles) &&
    isWorkspaceList(v.permittedWorkspaces) &&
    (v.activeWorkspace === null || isWorkspaceId(v.activeWorkspace)) &&
    typeof v.displayName === 'string' &&
    typeof v.facilityId === 'string' &&
    typeof v.facilityName === 'string' &&
    typeof v.organisationId === 'string' &&
    typeof v.lastRemoteVerificationAt === 'string' &&
    typeof v.offlineAccessPolicyVersion === 'number' &&
    typeof v.localSetupCompletedAt === 'string' &&
    typeof v.biometricEnabled === 'boolean' &&
    (v.sessionState === 'ready' || v.sessionState === 'locked')
  );
}
