import { getAppConfig } from '../../../config/appConfig';
import { mapServerRolesToMobile } from '../domain/roles';
import type { WorkspaceId } from '../domain/workspaces';
import { requestDevelopmentAccessToken } from '../../sync/application/accessTokenStore';
import type { AuthAccount, AuthRole, SignInCredentials } from '../domain/types';
import { isDemoLocalAuthEnabled } from './demoLocalAuth';
import type {
  ChangePasswordInput,
  PasswordPolicy,
  RemoteAuthProvider,
  SignInResult,
} from './RemoteAuthProvider';
import { rolesMatch } from './RemoteAuthProvider';

/**
 * Synthetic demo / hackathon accounts — NOT production credentials.
 * Passwords are only for local prototype/testing and never logged.
 *
 * `passwords` may list more than one accepted value so local login and API sync
 * passwords both work (e.g. Hamdan: Mama0599545544@ and NorthCareDemo1!).
 */
type DevAccount = AuthAccount & {
  readonly passwords: readonly string[];
  readonly serverRoles: readonly string[];
  /** Optional demo login email (checked before API). */
  readonly loginEmail?: string;
  /** Additional demo login emails for the same account. */
  readonly loginEmails?: readonly string[];
};

function accountLoginEmails(account: DevAccount): readonly string[] {
  const emails = [
    ...(account.loginEmails ?? []),
    ...(account.loginEmail ? [account.loginEmail] : []),
  ];
  return emails.map((email) => email.trim().toLowerCase());
}

function passwordsMatch(
  accepted: readonly string[],
  candidate: string,
): boolean {
  return accepted.includes(candidate);
}

function workspacesForRoles(roles: readonly string[]): WorkspaceId[] {
  const workspaces: WorkspaceId[] = [];
  if (roles.includes('worker')) {
    workspaces.push('worker');
  }
  if (roles.includes('admin') || roles.includes('administrator')) {
    workspaces.push('administration');
  }
  return workspaces;
}

function accountFromDevRecord(account: DevAccount, nowIso: string): AuthAccount {
  const availableRoles = mapServerRolesToMobile(account.serverRoles);
  return {
    ...stripPassword(account, nowIso),
    availableRoles,
    permittedWorkspaces: workspacesForRoles(account.serverRoles),
  };
}

const DEV_ACCOUNTS: readonly DevAccount[] = [
  {
    accountId: 'dev-worker-001',
    displayName: 'Synthetic Worker',
    role: 'worker',
    availableRoles: ['worker'],
    permittedWorkspaces: ['worker'],
    serverRoles: ['worker'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['WorkerDemo1!'],
  },
  {
    accountId: 'dev-worker-tth',
    displayName: 'Synthetic TTH Receiving Worker',
    role: 'worker',
    availableRoles: ['worker'],
    permittedWorkspaces: ['worker'],
    serverRoles: ['worker'],
    facilityId: 'GH-TTH',
    facilityName: 'Tamale Teaching Hospital',
    facilityType: 'TeachingHospital',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['TthWorker1!'],
  },
  {
    accountId: 'dev-worker-temp',
    displayName: 'Synthetic Worker (temp password)',
    role: 'worker',
    availableRoles: ['worker'],
    permittedWorkspaces: ['worker'],
    serverRoles: ['worker'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: true,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['TempPass1!'],
  },
  {
    accountId: 'dev-admin-001',
    displayName: 'Synthetic Administrator',
    role: 'administrator',
    availableRoles: ['administrator'],
    permittedWorkspaces: ['administration'],
    serverRoles: ['admin'],
    facilityId: 'fac-dev-hq',
    facilityName: 'Demo District Health Office',
    facilityType: 'District office',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['AdminDemo1!'],
  },
  {
    accountId: 'dev-dual-8d2ce4bbb8e656c8afea',
    loginEmails: ['hamdansalifupolibu@gmail.com', 'hammydanny@gmail.com'],
    displayName: 'Hamdan Salifu Polibu',
    role: 'worker',
    availableRoles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    serverRoles: ['worker', 'admin'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    // Local device password + shared API sync password (both accepted offline).
    passwords: ['Mama0599545544@', 'NorthCareDemo1!'],
  },
  {
    accountId: 'dev-dual-salma-abubakar',
    loginEmail: 'salmaabukari4@gmail.com',
    displayName: 'Salma Abubakar',
    role: 'worker',
    availableRoles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    serverRoles: ['worker', 'admin'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['NorthCare@123'],
  },
  {
    accountId: 'dev-dual-ibrahim-takiya',
    loginEmail: 'ibrahimtakiya06@gmail.com',
    displayName: 'Ibrahim Takiya',
    role: 'worker',
    availableRoles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    serverRoles: ['worker', 'admin'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['NorthCare@123'],
  },
  {
    accountId: 'dev-dual-hammydanny1',
    loginEmail: 'hammydanny1@gmail.com',
    displayName: 'Hammy Danny (Demo Admin)',
    role: 'worker',
    availableRoles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    serverRoles: ['worker', 'admin'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    districtOrRegion: 'Northern Region (synthetic)',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: true,
    status: 'active',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['Mama0599545544@', 'NorthCareDemo1!'],
  },
  {
    accountId: 'dev-worker-inactive',
    displayName: 'Synthetic Inactive Worker',
    role: 'worker',
    availableRoles: ['worker'],
    permittedWorkspaces: ['worker'],
    serverRoles: ['worker'],
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    organisationId: 'org-dev-001',
    organisationName: 'NorthCare Demo Organisation',
    isActive: false,
    status: 'inactive',
    requiresPasswordChange: false,
    remoteAuthenticationTime: '',
    offlineAccessPolicyVersion: 1,
    passwords: ['Inactive1!'],
  },
];

function stripPassword(account: DevAccount, nowIso: string): AuthAccount {
  const { passwords: _passwords, ...rest } = account;
  return {
    ...rest,
    remoteAuthenticationTime: nowIso,
  };
}

function findLocalDevAccountByEmail(email: string): DevAccount | undefined {
  const normalised = email.trim().toLowerCase();
  return DEV_ACCOUNTS.find((account) => accountLoginEmails(account).includes(normalised));
}

function authenticateLocalDevAccount(
  account: DevAccount,
  credentials: SignInCredentials,
  passwords: Map<string, readonly string[]>,
): SignInResult {
  const accepted = passwords.get(account.accountId) ?? [];
  if (!passwordsMatch(accepted, credentials.password)) {
    return {
      ok: false,
      error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
    };
  }

  if (!account.isActive || account.status === 'inactive' || account.status === 'accessRevoked') {
    return {
      ok: false,
      error: { code: 'accountInactive', messageKey: 'accountInactive' },
    };
  }

  const availableRoles = mapServerRolesToMobile(account.serverRoles);
  if (!availableRoles.includes(credentials.expectedRole)) {
    return {
      ok: false,
      error: { code: 'roleMismatch', messageKey: 'roleMismatch' },
    };
  }

  const now = new Date().toISOString();
  const signedIn = accountFromDevRecord(account, now);

  if (account.requiresPasswordChange) {
    return {
      ok: false,
      error: { code: 'passwordChangeRequired', messageKey: 'passwordChangeRequired' },
      account: signedIn,
    };
  }

  return { ok: true, account: { ...signedIn, role: credentials.expectedRole } };
}

function findByIdentifier(loginIdentifier: string): DevAccount | undefined {
  const normalised = loginIdentifier.trim().toLowerCase();
  return (
    findLocalDevAccountByEmail(normalised) ??
    DEV_ACCOUNTS.find(
      (account) =>
        account.accountId.toLowerCase() === normalised ||
        account.displayName.toLowerCase() === normalised,
    )
  );
}

/**
 * Demo / hackathon local auth. Throws unless demo local auth is enabled.
 */
export function createDevelopmentAuthProvider(options?: {
  readonly simulateNetworkUnavailable?: boolean;
}): RemoteAuthProvider {
  if (!isDemoLocalAuthEnabled()) {
    throw new Error('DevelopmentAuthProvider cannot activate without demo local auth.');
  }

  let current: AuthAccount | null = null;
  let simulateNetwork = options?.simulateNetworkUnavailable ?? false;
  const passwords = new Map(DEV_ACCOUNTS.map((a) => [a.accountId, [...a.passwords]]));

  const policy: PasswordPolicy = {
    minLength: 8,
    requireMixedCase: true,
    requireDigit: true,
  };

  const provider: RemoteAuthProvider = {
    id: 'development',
    getPasswordPolicy: () => policy,
    async signIn(credentials: SignInCredentials): Promise<SignInResult> {
      if (simulateNetwork) {
        return {
          ok: false,
          error: {
            code: 'networkUnavailable',
            messageKey: 'networkUnavailable',
          },
        };
      }

      const normalisedCredentials: SignInCredentials = {
        loginIdentifier: credentials.loginIdentifier.trim(),
        password: credentials.password.trim(),
        expectedRole: credentials.expectedRole,
      };

      const isEmail = normalisedCredentials.loginIdentifier.includes('@');
      if (isEmail) {
        const localEmailAccount = findLocalDevAccountByEmail(
          normalisedCredentials.loginIdentifier,
        );
        if (localEmailAccount) {
          const localResult = authenticateLocalDevAccount(
            localEmailAccount,
            normalisedCredentials,
            passwords,
          );
          if (localResult.ok && localResult.account) {
            current = localResult.account;
          }
          return localResult;
        }

        if (!isDemoLocalAuthEnabled()) {
          return {
            ok: false,
            error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
          };
        }
        try {
          const remote = await requestDevelopmentAccessToken({
            email: normalisedCredentials.loginIdentifier.toLowerCase(),
            password: normalisedCredentials.password,
          });
          const availableRoles = mapServerRolesToMobile(remote.roles.length > 0 ? remote.roles : [remote.role]);
          if (availableRoles.length === 0) {
            return {
              ok: false,
              error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
            };
          }
          const permittedWorkspaces = remote.permittedWorkspaces.filter(
            (workspace): workspace is WorkspaceId =>
              workspace === 'worker' || workspace === 'administration',
          );
          const now = new Date().toISOString();
          const remoteAccount: AuthAccount = {
            accountId: remote.accountId,
            displayName: remote.displayName ?? 'Development account',
            role: normalisedCredentials.expectedRole,
            availableRoles,
            permittedWorkspaces,
            accountVersion: remote.accountVersion,
            facilityId: remote.facilityId,
            facilityName:
              remote.facilityId === 'fac-dev-001'
                ? 'Demo CHPS Compound'
                : 'Synthetic development facility',
            facilityType: 'CHPS',
            districtOrRegion: 'Northern Region (synthetic)',
            organisationId: remote.organisationId ?? 'org-dev-001',
            organisationName: 'NorthCare Demo Organisation',
            isActive: remote.accountStatus !== 'inactive',
            status:
              remote.accountStatus === 'inactive'
                ? 'inactive'
                : remote.firstLoginRequired
                  ? 'passwordResetRequired'
                  : 'active',
            requiresPasswordChange: remote.firstLoginRequired,
            remoteAuthenticationTime: now,
            offlineAccessPolicyVersion: 1,
          };
          if (!availableRoles.includes(normalisedCredentials.expectedRole)) {
            return {
              ok: false,
              error: { code: 'roleMismatch', messageKey: 'roleMismatch' },
            };
          }
          current = remoteAccount;
          return { ok: true, account: current };
        } catch {
          return {
            ok: false,
            error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
          };
        }
      }

      const account = findByIdentifier(normalisedCredentials.loginIdentifier);
      const accepted = account ? passwords.get(account.accountId) ?? [] : [];
      if (!account || !passwordsMatch(accepted, normalisedCredentials.password)) {
        return {
          ok: false,
          error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
        };
      }

      if (!account.isActive || account.status === 'inactive' || account.status === 'accessRevoked') {
        return {
          ok: false,
          error: { code: 'accountInactive', messageKey: 'accountInactive' },
        };
      }

      if (
        !rolesMatch({
          expectedRole: normalisedCredentials.expectedRole,
          accountRole: account.role,
        }) &&
        !mapServerRolesToMobile(account.serverRoles).includes(
          normalisedCredentials.expectedRole,
        )
      ) {
        return {
          ok: false,
          error: { code: 'roleMismatch', messageKey: 'roleMismatch' },
        };
      }

      const now = new Date().toISOString();
      current = {
        ...accountFromDevRecord(account, now),
        role: normalisedCredentials.expectedRole,
      };

      if (account.requiresPasswordChange) {
        return {
          ok: false,
          error: { code: 'passwordChangeRequired', messageKey: 'passwordChangeRequired' },
          account: current,
        };
      }

      return { ok: true, account: current };
    },
    async signOut() {
      current = null;
    },
    async changePassword(input: ChangePasswordInput): Promise<SignInResult> {
      if (simulateNetwork) {
        return {
          ok: false,
          error: { code: 'networkUnavailable', messageKey: 'networkUnavailable' },
        };
      }
      const account = DEV_ACCOUNTS.find((a) => a.accountId === input.accountId);
      const accepted = account ? passwords.get(account.accountId) ?? [] : [];
      if (!account || !passwordsMatch(accepted, input.currentPassword.trim())) {
        return {
          ok: false,
          error: { code: 'invalidCredentials', messageKey: 'invalidCredentials' },
        };
      }
      passwords.set(account.accountId, [input.newPassword.trim()]);
      const now = new Date().toISOString();
      current = {
        ...accountFromDevRecord(account, now),
        requiresPasswordChange: false,
      };
      return { ok: true, account: current };
    },
    async requestPasswordReset(_loginIdentifier: string) {
      return { ok: true, genericMessageKey: 'recoverySubmitted' };
    },
    async getCurrentAccount() {
      return current;
    },
    async refreshAccountStatus(accountId: string): Promise<SignInResult> {
      const account = DEV_ACCOUNTS.find((a) => a.accountId === accountId);
      if (!account) {
        return {
          ok: false,
          error: { code: 'accessRevoked', messageKey: 'accessRevoked' },
        };
      }
      if (!account.isActive) {
        return {
          ok: false,
          error: { code: 'accountInactive', messageKey: 'accountInactive' },
        };
      }
      const now = new Date().toISOString();
      current = accountFromDevRecord(account, now);
      return { ok: true, account: current };
    },
  };

  Object.defineProperty(provider, 'simulateNetworkUnavailable', {
    get: () => simulateNetwork,
    set: (value: boolean) => {
      simulateNetwork = value;
    },
    enumerable: true,
    configurable: true,
  });

  return provider;
}

/** Synthetic identifiers for development UI (never show passwords in production). */
export function listDevelopmentSyntheticAccounts(): readonly {
  readonly accountId: string;
  readonly role: AuthRole;
  readonly label: string;
  readonly requiresPasswordChange: boolean;
}[] {
  return DEV_ACCOUNTS.map((account) => ({
    accountId: account.accountId,
    role: account.role,
    label: account.displayName,
    requiresPasswordChange: account.requiresPasswordChange,
  }));
}
