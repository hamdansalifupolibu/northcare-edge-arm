import type { Client } from '../../../data/domain/entities/entities';
import { normalizeSearchText } from '../../../data/domain/validation/normalizeSearch';

export type DuplicateMatchReason =
  | 'sameFullName'
  | 'sameDateOfBirth'
  | 'sameApproximateAge'
  | 'samePhone'
  | 'sameCommunity'
  | 'sameClientCode';

export type DuplicateCandidate = {
  readonly client: Client;
  readonly reasons: readonly DuplicateMatchReason[];
  readonly strength: 'strong' | 'partial';
};

export type DuplicateCheckInput = {
  readonly givenName: string;
  readonly familyName: string;
  readonly dateOfBirth?: string | null;
  readonly approximateAge?: number | null;
  readonly approximateAgeUnit?: string | null;
  readonly phoneNumber?: string | null;
  readonly community?: string | null;
  readonly clientCode?: string | null;
};

/**
 * LOCAL MVP RULES — REQUIRE PILOT REVIEW
 * Conservative, explainable matching. No AI / no unexplained scores.
 */
export function findDuplicateCandidates(
  existing: readonly Client[],
  input: DuplicateCheckInput,
): DuplicateCandidate[] {
  const inputName = normalizeSearchText(`${input.givenName} ${input.familyName}`);
  const inputPhone = normalizePhone(input.phoneNumber);
  const inputCommunity = input.community
    ? normalizeSearchText(input.community)
    : null;
  const inputCode = input.clientCode?.trim().toUpperCase() ?? null;

  const candidates: DuplicateCandidate[] = [];

  for (const client of existing) {
    if (client.isDeleted) {
      continue;
    }
    const reasons: DuplicateMatchReason[] = [];
    if (client.searchNormalized === inputName && inputName.length > 0) {
      reasons.push('sameFullName');
    }
    if (
      input.dateOfBirth &&
      client.dateOfBirth &&
      client.dateOfBirth === input.dateOfBirth
    ) {
      reasons.push('sameDateOfBirth');
    }
    if (
      input.approximateAge != null &&
      client.approximateAge != null &&
      input.approximateAgeUnit &&
      client.approximateAgeUnit === input.approximateAgeUnit &&
      client.approximateAge === input.approximateAge
    ) {
      reasons.push('sameApproximateAge');
    }
    if (inputPhone && normalizePhone(client.phoneNumber) === inputPhone) {
      reasons.push('samePhone');
    }
    if (
      inputCommunity &&
      client.community &&
      normalizeSearchText(client.community) === inputCommunity
    ) {
      reasons.push('sameCommunity');
    }
    if (inputCode && client.clientCode.toUpperCase() === inputCode) {
      reasons.push('sameClientCode');
    }

    if (reasons.length === 0) {
      continue;
    }

    const strong =
      reasons.includes('sameClientCode') ||
      (reasons.includes('sameFullName') &&
        (reasons.includes('sameDateOfBirth') ||
          reasons.includes('samePhone') ||
          reasons.includes('sameApproximateAge'))) ||
      (reasons.includes('sameFullName') &&
        reasons.includes('sameCommunity') &&
        reasons.length >= 2);

    candidates.push({
      client,
      reasons,
      strength: strong ? 'strong' : 'partial',
    });
  }

  return candidates.sort((a, b) => {
    if (a.strength !== b.strength) {
      return a.strength === 'strong' ? -1 : 1;
    }
    return b.reasons.length - a.reasons.length;
  });
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const digits = value.replace(/\D+/g, '');
  return digits.length >= 7 ? digits : null;
}
