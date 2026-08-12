import Constants from 'expo-constants';

import { getAppConfig } from '../../../config/appConfig';
import { DEVELOPMENT_OFFLINE_ACCESS_POLICY } from '../domain/offlinePolicy';
import {
  SESSION_ENVELOPE_SCHEMA_VERSION,
  type LocalSessionEnvelope,
} from '../domain/sessionEnvelope';
import type { AuthAccount } from '../domain/types';

/**
 * Temporary development-only auth bypass.
 *
 * Enable: EXPO_PUBLIC_DEV_AUTH_BYPASS=true (and a __DEV__ / development build).
 * Disable: remove the flag or set it to false, then reload Metro.
 *
 * Never enable in production or staging builds.
 */
export const DEV_AUTH_BYPASS_ACCOUNT_ID = 'dev-dual-8d2ce4bbb8e656c8afea';
export const DEV_AUTH_BYPASS_EMAIL = 'hamdansalifupolibu@gmail.com';

function envBypassFlagEnabled(): boolean {
  const env = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS;
  // Metro .env overrides native extra baked at prebuild (hackathon demo toggles without rebuild).
  if (env === 'false') {
    return false;
  }
  if (env === 'true') {
    return true;
  }
  const extra = Constants.expoConfig?.extra as { readonly devAuthBypass?: unknown } | undefined;
  return extra?.devAuthBypass === true;
}

export function isDevAuthBypassEnabled(): boolean {
  if (getAppConfig().appEnv !== 'development') {
    return false;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__ === false) {
    return false;
  }
  return envBypassFlagEnabled();
}

export function createDevBypassAccount(nowIso: string = new Date().toISOString()): AuthAccount {
  return {
    accountId: DEV_AUTH_BYPASS_ACCOUNT_ID,
    displayName: 'Hamdan Salifu Polibu',
    role: 'worker',
    availableRoles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: nowIso,
    offlineAccessPolicyVersion: DEVELOPMENT_OFFLINE_ACCESS_POLICY.version,
  };
}

/**
 * Dual-role session with no active workspace — caller must pick Worker or Administration.
 * Conceptual identity matches the development dual-role account (CHO + Reach flags on server).
 * Local screens use this envelope; API-backed Reach features still need a real access token.
 */
export function createDevBypassSessionEnvelope(
  nowIso: string = new Date().toISOString(),
): LocalSessionEnvelope {
  const account = createDevBypassAccount(nowIso);
  return {
    schemaVersion: SESSION_ENVELOPE_SCHEMA_VERSION,
    accountId: account.accountId,
    role: account.role,
    availableRoles: [...account.availableRoles],
    permittedWorkspaces: [...account.permittedWorkspaces],
    activeWorkspace: null,
    displayName: account.displayName,
    facilityId: account.facilityId,
    facilityName: account.facilityName,
    organisationId: account.organisationId,
    lastRemoteVerificationAt: nowIso,
    offlineAccessPolicyVersion: DEVELOPMENT_OFFLINE_ACCESS_POLICY.version,
    localSetupCompletedAt: nowIso,
    biometricEnabled: false,
    sessionState: 'ready',
  };
}
