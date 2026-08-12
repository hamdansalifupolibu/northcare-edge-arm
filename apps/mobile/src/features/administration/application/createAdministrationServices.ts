import type { AdministrationApiClient } from '../transport/administrationApiClient';
import type {
  AccountSearchQuery,
  AdminAccountDetails,
  AdminAccountListPage,
  AdminDevice,
  AdminFacility,
  AdminHistoryEvent,
  AdminHomeSummary,
  AdminSyncedRecordPage,
  MutationAck,
  ProfessionRegistryItem,
  ProfessionalProfile,
  ProfessionalProfileInput,
  RegisterWorkerInput,
  RegisterWorkerResult,
  SessionAuthorisation,
} from '../domain/types';

export type AdministrationServices = {
  getSessionAuthorisation(): Promise<SessionAuthorisation>;
  getAdminHome(): Promise<AdminHomeSummary>;
  listSyncedRecords(query?: {
    readonly facilityId?: string;
    readonly entityType?: string;
    readonly limit?: number;
  }): Promise<AdminSyncedRecordPage>;
  listFacilities(): Promise<readonly AdminFacility[]>;
  listProfessions(): Promise<readonly ProfessionRegistryItem[]>;
  listAccounts(query: AccountSearchQuery): Promise<AdminAccountListPage>;
  searchAccounts(query: AccountSearchQuery): Promise<AdminAccountListPage>;
  getAccountDetails(accountId: string): Promise<AdminAccountDetails>;
  registerWorker(input: RegisterWorkerInput): Promise<RegisterWorkerResult>;
  upsertProfessionalProfile(
    accountId: string,
    input: ProfessionalProfileInput,
  ): Promise<ProfessionalProfile>;
  assignWorkerFacility(
    accountId: string,
    facilityId: string,
    expectedAccountVersion: number,
  ): Promise<MutationAck>;
  deactivateWorker(accountId: string, expectedAccountVersion: number): Promise<MutationAck>;
  reactivateWorker(accountId: string, expectedAccountVersion: number): Promise<MutationAck>;
  initiateWorkerAccessReset(
    accountId: string,
    expectedAccountVersion: number,
    temporaryPassword: string,
  ): Promise<MutationAck>;
  listRegisteredDevices(accountId: string, currentDeviceId?: string): Promise<readonly AdminDevice[]>;
  revokeRegisteredDevice(accountId: string, deviceId: string): Promise<AdminDevice>;
  getAdministrationHistory(accountId: string): Promise<readonly AdminHistoryEvent[]>;
};

export function createAdministrationServices(
  client: AdministrationApiClient,
): AdministrationServices {
  return {
    getSessionAuthorisation: () => client.getSessionAuthorisation(),
    getAdminHome: () => client.getAdminHome(),
    listSyncedRecords: (query) => client.listSyncedRecords(query),
    listFacilities: () => client.listFacilities(),
    listProfessions: () => client.listProfessions(),
    listAccounts: (query) => client.listAccounts(query),
    searchAccounts: (query) => client.listAccounts(query),
    getAccountDetails: (accountId) => client.getAccountDetails(accountId),
    registerWorker: (input) => client.registerWorker(input),
    upsertProfessionalProfile: (accountId, input) =>
      client.upsertProfessionalProfile(accountId, input),
    assignWorkerFacility: (accountId, facilityId, expectedAccountVersion) =>
      client.assignWorkerFacility(accountId, facilityId, expectedAccountVersion),
    deactivateWorker: (accountId, expectedAccountVersion) =>
      client.deactivateWorker(accountId, expectedAccountVersion),
    reactivateWorker: (accountId, expectedAccountVersion) =>
      client.reactivateWorker(accountId, expectedAccountVersion),
    initiateWorkerAccessReset: (accountId, expectedAccountVersion, temporaryPassword) =>
      client.initiateWorkerAccessReset(accountId, expectedAccountVersion, temporaryPassword),
    listRegisteredDevices: (accountId, currentDeviceId) =>
      client.listRegisteredDevices(accountId, currentDeviceId),
    revokeRegisteredDevice: (accountId, deviceId) =>
      client.revokeRegisteredDevice(accountId, deviceId),
    getAdministrationHistory: (accountId) => client.getAdministrationHistory(accountId),
  };
}
