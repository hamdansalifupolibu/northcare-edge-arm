export type DemoAccount = {
  readonly accountId: string;
  readonly remoteSubject: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: string;
  readonly roles: readonly string[];
  readonly permittedWorkspaces: readonly string[];
  readonly facilityId: string;
  readonly organisationId: string;
  readonly accountStatus: string;
  readonly firstLoginRequired: boolean;
  readonly accountVersion: number;
  /** When set, overrides DEMO_SYNC_PASSWORD for this account (development only). */
  readonly demoPassword?: string;
  /** Extra accepted passwords (local device + sync), development only. */
  readonly demoPasswords?: readonly string[];
};

/** Demo accounts — passwords checked against per-account override(s) or DEMO_SYNC_PASSWORD. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    accountId: 'dev-dual-8d2ce4bbb8e656c8afea',
    remoteSubject: 'dev-dual-8d2ce4bbb8e656c8afea',
    email: 'hamdansalifupolibu@gmail.com',
    displayName: 'Hamdan Salifu Polibu',
    role: 'worker',
    roles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    facilityId: 'fac-dev-001',
    organisationId: 'org-dev-001',
    accountStatus: 'active',
    firstLoginRequired: false,
    accountVersion: 1,
    // Accept both local device password and shared DEMO_SYNC_PASSWORD default.
    demoPasswords: ['Mama0599545544@', 'NorthCareDemo1!'],
  },
  {
    accountId: 'dev-dual-salma-abubakar',
    remoteSubject: 'dev-dual-salma-abubakar',
    email: 'salmaabukari4@gmail.com',
    displayName: 'Salma Abubakar',
    role: 'worker',
    roles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    facilityId: 'fac-dev-001',
    organisationId: 'org-dev-001',
    accountStatus: 'active',
    firstLoginRequired: false,
    accountVersion: 1,
    demoPassword: 'NorthCare@123',
  },
  {
    accountId: 'dev-dual-ibrahim-takiya',
    remoteSubject: 'dev-dual-ibrahim-takiya',
    email: 'ibrahimtakiya06@gmail.com',
    displayName: 'Ibrahim Takiya',
    role: 'worker',
    roles: ['worker', 'administrator'],
    permittedWorkspaces: ['worker', 'administration'],
    facilityId: 'fac-dev-001',
    organisationId: 'org-dev-001',
    accountStatus: 'active',
    firstLoginRequired: false,
    accountVersion: 1,
    demoPassword: 'NorthCare@123',
  },
  {
    accountId: 'dev-admin-demo',
    remoteSubject: 'dev-admin-demo',
    email: 'hammydanny1@gmail.com',
    displayName: 'Demo Administrator',
    role: 'administrator',
    roles: ['administrator'],
    permittedWorkspaces: ['administration'],
    facilityId: 'fac-dev-hq',
    organisationId: 'org-dev-001',
    accountStatus: 'active',
    firstLoginRequired: false,
    accountVersion: 1,
    demoPasswords: ['Mama0599545544@', 'NorthCareDemo1!'],
  },
];

export function resolveDemoAccountPassword(
  account: DemoAccount,
  defaultPassword: string,
): string {
  return account.demoPassword ?? account.demoPasswords?.[0] ?? defaultPassword;
}

/** True when the supplied password is accepted for this demo account. */
export function isValidDemoAccountPassword(
  account: DemoAccount,
  password: string,
  defaultPassword: string,
): boolean {
  const candidate = password.trim();
  if (candidate.length === 0) {
    return false;
  }
  const accepted = new Set<string>();
  if (account.demoPasswords && account.demoPasswords.length > 0) {
    for (const entry of account.demoPasswords) {
      accepted.add(entry);
    }
  } else if (account.demoPassword) {
    accepted.add(account.demoPassword);
  } else {
    accepted.add(defaultPassword);
  }
  return accepted.has(candidate);
}

export function findDemoAccountByEmail(email: string): DemoAccount | undefined {
  const normalised = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((account) => account.email === normalised);
}

export function findDemoAccountById(accountId: string): DemoAccount | undefined {
  const trimmed = accountId.trim();
  return DEMO_ACCOUNTS.find(
    (account) => account.accountId === trimmed || account.remoteSubject === trimmed,
  );
}

export type AuthenticatedContext = DemoAccount & {
  readonly tokenIssuedAt: number;
};

export type PushOperationInput = {
  readonly operationId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly operation: 'create' | 'update' | 'delete';
  readonly baseServerVersion: number | null;
  readonly clientLocalVersion: number;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: string;
  readonly requestHash: string;
};

export type PushResultOutput = {
  readonly operationId: string;
  readonly status: 'acked' | 'duplicate' | 'conflict' | 'rejected';
  readonly serverVersion?: number | null;
  readonly conflictId?: string | null;
  readonly errorCode?: string | null;
};
