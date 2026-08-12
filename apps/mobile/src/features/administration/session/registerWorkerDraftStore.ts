import type { OfflineRegisterWorkerInput } from '../application/createOfflineProvisioningServices';

export type RegisterWorkerDraft = {
  readonly displayName: string;
  readonly email: string;
  readonly facilityId: string;
  readonly profession: string;
  readonly otherProfessionDescription: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly idempotencyKey: string;
};

export type RegisteredActivationHandoff = {
  readonly enrollmentId: string;
  readonly activationUri: string;
  readonly expiresAt: string;
  readonly displayName: string;
};

let draft: RegisterWorkerDraft | null = null;
let registeredActivation: RegisteredActivationHandoff | null = null;

export function getRegisterWorkerDraft(): RegisterWorkerDraft | null {
  return draft;
}

export function updateRegisterWorkerDraft(patch: Partial<RegisterWorkerDraft>): RegisterWorkerDraft {
  draft = {
    displayName: draft?.displayName ?? '',
    email: draft?.email ?? '',
    facilityId: draft?.facilityId ?? '',
    profession: draft?.profession ?? '',
    otherProfessionDescription: draft?.otherProfessionDescription ?? null,
    communityRequestsEnabled: draft?.communityRequestsEnabled ?? false,
    emergencyRequestsEnabled: draft?.emergencyRequestsEnabled ?? false,
    idempotencyKey: draft?.idempotencyKey ?? `enroll-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    ...patch,
  };
  return draft;
}

export function clearRegisterWorkerDraft(): void {
  draft = null;
}

export function setRegisteredActivationHandoff(handoff: RegisteredActivationHandoff): void {
  registeredActivation = handoff;
}

export function getRegisteredActivationHandoff(): RegisteredActivationHandoff | null {
  return registeredActivation;
}

export function clearRegisteredActivationHandoff(): void {
  registeredActivation = null;
}

/** @deprecated Use enrollment id from offline handoff */
export function setRegisteredAccountId(accountId: string): void {
  setRegisteredActivationHandoff({
    enrollmentId: accountId,
    activationUri: '',
    expiresAt: '',
    displayName: '',
  });
}

export function getRegisteredAccountId(): string | null {
  return registeredActivation?.enrollmentId ?? null;
}

export function clearRegisteredAccountId(): void {
  clearRegisteredActivationHandoff();
}

export type { OfflineRegisterWorkerInput };
