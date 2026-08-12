export type AdminAccountStatus =
  | 'active'
  | 'inactive'
  | 'pendingFirstLogin'
  | 'suspended'
  | 'accessRevoked';

export type AdminAccountSummary = {
  readonly accountId: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly roles: readonly string[];
  readonly facilityId: string;
  readonly facilityName: string;
  readonly accountStatus: AdminAccountStatus;
  readonly firstLoginRequired: boolean;
  readonly lastRemoteSignInAt: string | null;
  readonly registeredDeviceCount: number;
  readonly accountVersion: number;
  readonly updatedAt: string;
};

export type ProfessionalProfile = {
  readonly accountId: string;
  readonly profession: string;
  readonly otherProfessionDescription: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AdminAccountDetails = AdminAccountSummary & {
  readonly organisationId: string;
  readonly organisationName: string;
  readonly identityProvider: string;
  readonly createdAt: string;
  readonly permittedWorkspaces: readonly string[];
  readonly professionalProfile: ProfessionalProfile | null;
};

export type ProfessionRegistryItem = {
  readonly value: string;
  readonly label: string;
  readonly active: boolean;
  readonly allowsOtherDescription: boolean;
  readonly displayOrder: number;
};

export type ProfessionalProfileInput = {
  readonly profession: string;
  readonly otherProfessionDescription?: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly expectedProfileVersion?: number | null;
};

export type AdminAccountListPage = {
  readonly items: readonly AdminAccountSummary[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly organisationId: string;
};

export type AdminFacility = {
  readonly facilityId: string;
  readonly name: string;
  readonly facilityType: string | null;
  readonly district: string | null;
  readonly region: string | null;
  readonly isActive: boolean;
};

export type AdminHomeSummary = {
  readonly organisationId: string;
  readonly workerCount: number;
  readonly pendingFirstLoginCount: number;
  readonly inactiveWorkerCount: number;
  readonly backendAvailable: boolean;
  readonly syncedRecordCount?: number;
};

export type AdminSyncedRecord = {
  readonly facilityId: string;
  readonly facilityName: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly serverVersion: number;
  readonly payload: Readonly<Record<string, unknown>> | null;
  readonly updatedAt: string;
  readonly syncedByAccountId: string | null;
};

export type AdminSyncedRecordPage = {
  readonly items: readonly AdminSyncedRecord[];
  readonly total: number;
  readonly organisationId: string;
};

export type AdminDevice = {
  readonly deviceId: string;
  readonly label: string | null;
  readonly platform: string | null;
  readonly appVersion: string | null;
  readonly status: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly isCurrent: boolean;
};

export type AdminHistoryEvent = {
  readonly eventId: string;
  readonly eventType: string;
  readonly createdAt: string;
  readonly actorAccountId: string;
  readonly targetAccountId: string | null;
  readonly result: string;
  readonly reasonCategory: string | null;
};

export type RegisterWorkerInput = {
  readonly displayName: string;
  readonly email: string;
  readonly facilityId: string;
  readonly temporaryPassword: string;
  readonly idempotencyKey: string;
  readonly profession: string;
  readonly otherProfessionDescription?: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
};

export type RegisterWorkerResult = {
  readonly accountId: string;
  readonly displayName: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly facilityId: string;
  readonly accountStatus: AdminAccountStatus;
  readonly firstLoginRequired: boolean;
  readonly accountVersion: number;
  readonly identityProvider: string;
  readonly professionalProfile: ProfessionalProfile;
};

export type MutationAck = {
  readonly accountId: string;
  readonly accountStatus: AdminAccountStatus;
  readonly accountVersion: number;
  readonly facilityId: string | null;
};

export type SessionAuthorisation = {
  readonly accountId: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly roles: readonly string[];
  readonly permittedWorkspaces: readonly string[];
  readonly accountStatus: string;
  readonly organisationId: string;
  readonly workerFacilityId: string | null;
  readonly firstLoginRequired: boolean;
  readonly accountVersion: number;
  readonly identityProvider: string;
};

export type AccountSearchQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly facilityId?: string;
  readonly status?: AdminAccountStatus;
};
