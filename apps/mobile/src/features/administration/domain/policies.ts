import type { AuthRole } from '../../auth/domain/types';
import type { WorkspaceId } from '../../auth/domain/workspaces';
import { rolePermitsWorkspace } from '../../auth/domain/roles';
import {
  allowsOtherProfessionDescription,
  isWorkerProfession,
  OTHER_PROFESSION_DESCRIPTION_MAX_LENGTH,
} from './professions';

export function assertAdministrationWorkspace(
  activeWorkspace: WorkspaceId | null,
  availableRoles: readonly AuthRole[],
): void {
  if (activeWorkspace !== 'administration') {
    throw new Error('Administration actions require the administration workspace.');
  }
  if (!rolePermitsWorkspace(availableRoles, 'administration')) {
    throw new Error('Administrator role is required.');
  }
}

export const ADMINISTRATION_CONNECTIVITY_MESSAGE =
  'Administration requires a secure connection';

export const TEMPORARY_PASSWORD_MIN_LENGTH = 12;

export function validateTemporaryPassword(password: string): boolean {
  if (password.length < TEMPORARY_PASSWORD_MIN_LENGTH) {
    return false;
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return false;
  }
  return true;
}

export function validateWorkerEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.includes('@') && trimmed.length >= 3;
}

export function validateProfessionalProfileForm(input: {
  readonly profession: string | null | undefined;
  readonly otherProfessionDescription?: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
}): string | null {
  if (!input.profession || !isWorkerProfession(input.profession)) {
    return 'profession';
  }
  if (allowsOtherProfessionDescription(input.profession)) {
    const description = input.otherProfessionDescription?.trim() ?? '';
    if (!description || description.length > OTHER_PROFESSION_DESCRIPTION_MAX_LENGTH) {
      return 'otherProfessionDescription';
    }
  } else if (input.otherProfessionDescription?.trim()) {
    return 'otherProfessionDescription';
  }
  if (input.emergencyRequestsEnabled && !input.communityRequestsEnabled) {
    return 'emergencyRequiresCommunity';
  }
  return null;
}
