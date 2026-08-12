import type { Client } from '../../../data/domain/entities/entities';
import { findDuplicateCandidates } from '../domain/duplicateDetection';

function makeClient(partial: Partial<Client> & Pick<Client, 'id' | 'givenName' | 'familyName'>): Client {
  return {
    clientCode: 'NC-TEST01',
    category: 'pregnant',
    preferredName: null,
    sex: null,
    dateOfBirth: null,
    approximateAge: null,
    approximateAgeUnit: null,
    pregnancyStatus: null,
    estimatedDeliveryDate: null,
    phoneNumber: null,
    community: null,
    district: null,
    region: null,
    primaryFacilityId: null,
    consentStatus: 'unknown',
    consentRecordedAt: null,
    notes: null,
    searchNormalized: `${partial.givenName} ${partial.familyName}`.toLowerCase(),
    createdAt: '2026-08-02T12:00:00.000Z',
    updatedAt: '2026-08-02T12:00:00.000Z',
    createdByAccountId: null,
    updatedByAccountId: null,
    localVersion: 1,
    serverVersion: null,
    syncStatus: 'pendingCreate',
    lastSyncedAt: null,
    deletedAt: null,
    isDeleted: false,
    ...partial,
  };
}

describe('findDuplicateCandidates', () => {
  it('returns no candidates when nothing overlaps', () => {
    const existing = [
      makeClient({
        id: '11111111-1111-4111-8111-111111111111',
        givenName: 'Ama',
        familyName: 'Synthetic',
        searchNormalized: 'ama synthetic',
      }),
    ];
    expect(
      findDuplicateCandidates(existing, {
        givenName: 'Kofi',
        familyName: 'Demo',
      }),
    ).toHaveLength(0);
  });

  it('flags a strong candidate for same name and date of birth', () => {
    const existing = [
      makeClient({
        id: '11111111-1111-4111-8111-111111111111',
        givenName: 'Ama',
        familyName: 'Synthetic',
        searchNormalized: 'ama synthetic',
        dateOfBirth: '1998-04-12',
      }),
    ];
    const result = findDuplicateCandidates(existing, {
      givenName: 'Ama',
      familyName: 'Synthetic',
      dateOfBirth: '1998-04-12',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.strength).toBe('strong');
    expect(result[0]?.reasons).toEqual(
      expect.arrayContaining(['sameFullName', 'sameDateOfBirth']),
    );
  });

  it('flags a partial candidate for community-only overlap with name', () => {
    const existing = [
      makeClient({
        id: '11111111-1111-4111-8111-111111111111',
        givenName: 'Ama',
        familyName: 'Synthetic',
        searchNormalized: 'ama synthetic',
        community: 'Tamale Central',
      }),
    ];
    const result = findDuplicateCandidates(existing, {
      givenName: 'Ama',
      familyName: 'Synthetic',
      community: 'Tamale Central',
    });
    expect(result[0]?.strength).toBe('strong');
  });
});
