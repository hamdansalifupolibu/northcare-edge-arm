import * as SecureStore from 'expo-secure-store';

import { getAppConfig } from '../../../config/appConfig';
import type { AccessTokenStore } from '../transport/syncTransport';

const ACCESS_TOKEN_KEY = 'northcare.sync.access-token.v1';

/** Sync credentials are isolated from SQLite and never written to logs. */
export function createSecureAccessTokenStore(): AccessTokenStore & {
  saveAccessToken(token: string): Promise<void>;
  clearAccessToken(): Promise<void>;
} {
  return {
    getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    async saveAccessToken(token) {
      if (!token) throw new Error('Refusing to store an empty access token.');
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    },
    clearAccessToken: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
  };
}

/** Firebase Functions cold starts can exceed 2s — allow time for demo sync auth. */
const DEVELOPMENT_TOKEN_TIMEOUT_MS = 15_000;

export async function requestDevelopmentAccessToken(input: {
  readonly accountId?: string;
  readonly email?: string;
  readonly password: string;
  readonly fetcher?: typeof fetch;
}): Promise<{
  readonly accessToken: string;
  readonly accountId: string;
  readonly role: string;
  readonly roles: readonly string[];
  readonly permittedWorkspaces: readonly string[];
  readonly facilityId: string;
  readonly organisationId: string | null;
  readonly accountStatus: string | null;
  readonly firstLoginRequired: boolean;
  readonly displayName: string | null;
  readonly accountVersion: number | undefined;
}> {
  const config = getAppConfig();
  if (config.appEnv !== 'development') {
    throw new Error('Development sync tokens are unavailable outside development.');
  }
  if (!config.apiBaseUrl) throw new Error('Sync server is not configured for this build.');
  const identifier = input.email ?? input.accountId;
  if (!identifier) throw new Error('Development identifier is required.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEVELOPMENT_TOKEN_TIMEOUT_MS);
  try {
    const response = await (input.fetcher ?? fetch)(
      new URL('/v1/development/auth/token', config.apiBaseUrl).toString(),
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(
          input.email
            ? { email: input.email, password: input.password }
            : { account_id: input.accountId, password: input.password },
        ),
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error('Development sync authentication failed.');
    const result = (await response.json()) as {
      access_token?: unknown;
      account_id?: unknown;
      role?: unknown;
      roles?: unknown;
      permitted_workspaces?: unknown;
      facility_id?: unknown;
      organisation_id?: unknown;
      account_status?: unknown;
      first_login_required?: unknown;
      display_name?: unknown;
      account_version?: unknown;
    };
    if (
      typeof result.access_token !== 'string' ||
      result.access_token.length === 0 ||
      typeof result.account_id !== 'string' ||
      typeof result.role !== 'string' ||
      typeof result.facility_id !== 'string'
    ) {
      throw new Error('Development sync authentication returned an invalid token.');
    }
    const roles = Array.isArray(result.roles)
      ? result.roles.filter((role): role is string => typeof role === 'string')
      : [result.role];
    const permittedWorkspaces = Array.isArray(result.permitted_workspaces)
      ? result.permitted_workspaces.filter(
          (workspace): workspace is string => typeof workspace === 'string',
        )
      : [];
    return {
      accessToken: result.access_token,
      accountId: result.account_id,
      role: result.role,
      roles,
      permittedWorkspaces,
      facilityId: result.facility_id,
      organisationId: typeof result.organisation_id === 'string' ? result.organisation_id : null,
      accountStatus: typeof result.account_status === 'string' ? result.account_status : null,
      firstLoginRequired: result.first_login_required === true,
      displayName: typeof result.display_name === 'string' ? result.display_name : null,
      accountVersion:
        typeof result.account_version === 'number' ? result.account_version : undefined,
    };
  } finally {
    clearTimeout(timeout);
  }
}
