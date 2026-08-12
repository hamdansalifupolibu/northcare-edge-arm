import type { AuthenticatedContext } from './types';

export function hasAdministratorRole(account: AuthenticatedContext): boolean {
  return account.roles.includes('administrator');
}

export function hasWorkerRole(account: AuthenticatedContext): boolean {
  return account.roles.includes('worker');
}

export function assertAdministratorRole(account: AuthenticatedContext): void {
  if (!hasAdministratorRole(account)) {
    throw new Error('administratorRoleRequired');
  }
}

export function assertWorkerRole(account: AuthenticatedContext): void {
  if (!hasWorkerRole(account)) {
    throw new Error('workerRoleRequired');
  }
}
