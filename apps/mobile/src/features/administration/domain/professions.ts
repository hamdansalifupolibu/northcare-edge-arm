/** Frozen Reach R0/R1 profession values — keep aligned with worker-profession-registry.json */

export const WORKER_PROFESSIONS = [
  'communityHealthOfficer',
  'communityHealthNurse',
  'registeredGeneralNurse',
  'midwife',
  'nutritionOfficer',
  'physicianAssistant',
  'emergencyMedicalTechnician',
  'otherApprovedHealthProfessional',
] as const;

export type WorkerProfession = (typeof WORKER_PROFESSIONS)[number];

export const OTHER_APPROVED_PROFESSION: WorkerProfession = 'otherApprovedHealthProfessional';

export const OTHER_PROFESSION_DESCRIPTION_MAX_LENGTH = 120;

export type ProfessionRegistryItem = {
  readonly value: WorkerProfession | string;
  readonly label: string;
  readonly active: boolean;
  readonly allowsOtherDescription: boolean;
  readonly displayOrder: number;
};

export function isWorkerProfession(value: string): value is WorkerProfession {
  return (WORKER_PROFESSIONS as readonly string[]).includes(value);
}

export function allowsOtherProfessionDescription(profession: string): boolean {
  return profession === OTHER_APPROVED_PROFESSION;
}
