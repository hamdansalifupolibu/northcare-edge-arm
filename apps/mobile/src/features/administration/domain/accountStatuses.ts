import type { AdminAccountStatus } from './types';

export const ADMIN_ACCOUNT_STATUSES: readonly AdminAccountStatus[] = [
  'active',
  'inactive',
  'pendingFirstLogin',
  'suspended',
  'accessRevoked',
];

export function isAdminAccountStatus(value: string): value is AdminAccountStatus {
  return (ADMIN_ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function accountStatusLabelKey(status: AdminAccountStatus): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    case 'pendingFirstLogin':
      return 'pendingFirstLogin';
    case 'suspended':
      return 'suspended';
    case 'accessRevoked':
      return 'accessRevoked';
    default: {
      const _exhaustive: never = status;
      return String(_exhaustive);
    }
  }
}

export function accountStatusChipTone(
  status: AdminAccountStatus,
): 'neutral' | 'success' | 'warning' | 'urgent' {
  switch (status) {
    case 'active':
      return 'success';
    case 'pendingFirstLogin':
      return 'warning';
    case 'inactive':
    case 'suspended':
    case 'accessRevoked':
      return 'urgent';
    default:
      return 'neutral';
  }
}
