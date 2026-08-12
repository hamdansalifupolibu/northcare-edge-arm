import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { RepositoryError } from '../../../data/repositories/errors/RepositoryError';
import { createClientServices } from '../application/createClientServices';
import {
  createEmptyRegisterDraft,
  type RegisterClientDraft,
} from '../application/validation';

function createSequentialIds(): IdGenerator {
  let n = 0;
  return {
    nextId: () => {
      n += 1;
      const hex = n.toString(16).padStart(12, '0');
      return `00000000-0000-4000-8000-${hex}`;
    },
  };
}

async function setup() {
  const { manager, repos } = await createTestDatabase();
  const facility = await repos.facilities.create({
    name: 'SYNTHETIC Stage7 Clinic',
    region: 'Northern',
    district: 'SYNTHETIC District',
  });
  const accountId = '22222222-2222-4222-8222-222222222222';
  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'SYNTHETIC Worker',
  });
  const services = createClientServices(
    repos,
    { withTransaction: (task) => manager.withTransaction(task) },
    createSequentialIds(),
  );
  return { manager, repos, services, facility, accountId };
}

function baseDraft(facilityId: string, overrides: Partial<RegisterClientDraft> = {}): RegisterClientDraft {
  return {
    ...createEmptyRegisterDraft(facilityId),
    category: 'pregnant',
    givenName: 'Ama',
    familyName: 'Synthetic',
    sex: 'female',
    ageMode: 'dateOfBirth',
    dateOfBirth: '1998-04-12',
    community: 'SYNTHETIC Community',
    district: 'SYNTHETIC District',
    region: 'Northern',
    primaryFacilityId: facilityId,
    consentStatus: 'recorded',
    phoneNotAvailable: true,
    includeCaregiver: true,
    caregiverGivenName: 'Kofi',
    caregiverFamilyName: 'Synthetic',
    relationshipType: 'guardian',
    caregiverLinkConfirmed: true,
    ...overrides,
  };
}

describe('client services vertical slice', () => {
  it('registers all categories and excludes archived from list', async () => {
    const { manager, services, facility, accountId } = await setup();
    const categories = ['pregnant', 'postnatal', 'newborn', 'childUnderFive'] as const;
    for (const category of categories) {
      const draft = baseDraft(facility.id, {
        category,
        givenName: category,
        familyName: 'Synthetic',
        includeCaregiver: true,
        caregiverGivenName: 'Care',
        caregiverFamilyName: category,
        relationshipType: category === 'pregnant' ? 'other' : 'mother',
        caregiverLinkConfirmed: true,
        ageMode: category === 'pregnant' ? 'dateOfBirth' : 'approximateAge',
        dateOfBirth: category === 'pregnant' ? '1998-04-12' : '',
        approximateAge: category === 'pregnant' ? '' : '3',
        approximateAgeUnit: category === 'pregnant' ? null : 'months',
        consentStatus: 'deferred',
      });
      const result = await services.registerClient({ draft, accountId });
      expect(result.client.category).toBe(category);
      expect(result.client.clientCode.startsWith('NC-')).toBe(true);
      expect(result.syncItem.state).toBe('pending');
      expect(result.auditEvent.eventType).toBe('client_registered');
      expect(result.caregiver).not.toBeNull();
    }

    const listed = await services.searchClients({ facilityId: facility.id });
    expect(listed).toHaveLength(4);

    const first = listed[0]!;
    await services.archiveClient({ id: first.id, accountId });
    const afterArchive = await services.searchClients({ facilityId: facility.id });
    expect(afterArchive.map((c) => c.id)).not.toContain(first.id);

    await manager.close();
  });

  it('registers without caregiver when contact is omitted', async () => {
    const { manager, services, facility, accountId } = await setup();
    const result = await services.registerClient({
      draft: baseDraft(facility.id, {
        category: 'newborn',
        givenName: 'Baby',
        familyName: 'OptionalCare',
        ageMode: 'approximateAge',
        dateOfBirth: '',
        approximateAge: '5',
        approximateAgeUnit: 'days',
        includeCaregiver: false,
        caregiverGivenName: '',
        caregiverFamilyName: '',
        relationshipType: null,
        caregiverLinkConfirmed: false,
      }),
      accountId,
    });
    expect(result.client.id).toBeTruthy();
    expect(result.caregiver).toBeNull();
    expect(result.relationship).toBeNull();
    const profile = await services.getClientProfile(result.client.id);
    expect(profile?.caregivers).toHaveLength(0);
    await manager.close();
  });

  it('searches and filters by category', async () => {
    const { manager, services, facility, accountId } = await setup();
    await services.registerClient({
      draft: baseDraft(facility.id, { givenName: 'Ama', category: 'pregnant' }),
      accountId,
    });
    await services.registerClient({
      draft: baseDraft(facility.id, {
        givenName: 'Baby',
        familyName: 'Synthetic',
        category: 'newborn',
        ageMode: 'approximateAge',
        dateOfBirth: '',
        approximateAge: '10',
        approximateAgeUnit: 'days',
      }),
      accountId,
    });

    const searched = await services.searchClients({ query: 'ama', facilityId: facility.id });
    expect(searched).toHaveLength(1);
    const filtered = await services.searchClients({
      category: 'newborn',
      facilityId: facility.id,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.category).toBe('newborn');
    await manager.close();
  });

  it('requires confirmation for strong duplicates and never auto-merges', async () => {
    const { manager, services, facility, accountId } = await setup();
    await services.registerClient({
      draft: baseDraft(facility.id),
      accountId,
    });
    const candidates = await services.checkPossibleDuplicates(baseDraft(facility.id));
    expect(candidates.some((c) => c.strength === 'strong')).toBe(true);

    await expect(
      services.registerClient({
        draft: baseDraft(facility.id, { duplicateContinueConfirmed: false }),
        accountId,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);

    const created = await services.registerClient({
      draft: baseDraft(facility.id, { duplicateContinueConfirmed: true }),
      accountId,
    });
    expect(created.client.id).toBeTruthy();
    const all = await services.searchClients({ facilityId: facility.id });
    expect(all).toHaveLength(2);
    await manager.close();
  });

  it('updates with version bump and detects stale edits', async () => {
    const { manager, services, facility, accountId, repos } = await setup();
    const created = await services.registerClient({
      draft: baseDraft(facility.id),
      accountId,
    });
    const updated = await services.updateClient({
      id: created.client.id,
      expectedLocalVersion: created.client.localVersion,
      accountId,
      preferredName: 'Ama S.',
      community: 'Updated Community',
    });
    expect(updated.localVersion).toBe(created.client.localVersion + 1);
    expect(updated.id).toBe(created.client.id);
    expect(updated.clientCode).toBe(created.client.clientCode);
    expect(updated.preferredName).toBe('Ama S.');
    expect(updated.community).toBe('Updated Community');

    const history = await repos.auditEvents.listForEntity('client', created.client.id);
    const updateEvent = history.find((event) => event.eventType === 'client_updated');
    expect(updateEvent).toBeTruthy();
    expect(updateEvent?.metadataJson).toContain('preferredName');
    expect(updateEvent?.metadataJson).toContain('community');
    expect(updateEvent?.metadataJson).not.toContain('Ama S.');

    const recent = await repos.auditEvents.listRecent({
      eventType: 'client_updated',
      limit: 10,
    });
    expect(recent.some((event) => event.entityId === created.client.id)).toBe(true);

    await expect(
      services.updateClient({
        id: created.client.id,
        expectedLocalVersion: created.client.localVersion,
        accountId,
        preferredName: 'Stale',
      }),
    ).rejects.toMatchObject({ category: 'conflict' });
    await manager.close();
  });

  it('loads profile without fabricating clinical history', async () => {
    const { manager, services, facility, accountId } = await setup();
    const created = await services.registerClient({
      draft: baseDraft(facility.id),
      accountId,
    });
    const profile = await services.getClientProfile(created.client.id);
    expect(profile?.client.id).toBe(created.client.id);
    expect(profile?.history.some((e) => e.eventType === 'client_registered')).toBe(true);
    expect(profile?.caregivers.length).toBeGreaterThan(0);
    await manager.close();
  });

  it('persists and reads back key registration fields through repositories', async () => {
    const { manager, services, facility, accountId } = await setup();
    const draft = baseDraft(facility.id, {
      preferredName: 'Ama Pref',
      sex: 'female',
      pregnancyStatus: 'confirmed',
      estimatedDeliveryDate: '2026-11-01',
      phoneNumber: '0244123456',
      phoneNotAvailable: false,
      community: 'Gushegu',
      district: 'Gushegu',
      region: 'Northern',
      notes: 'SYNTHETIC note',
      includeCaregiver: true,
      caregiverGivenName: 'Kofi',
      caregiverFamilyName: 'Guardian',
      caregiverPhone: '0200987654',
      relationshipType: 'guardian',
      caregiverLinkConfirmed: true,
    });
    const created = await services.registerClient({ draft, accountId });
    const profile = await services.getClientProfile(created.client.id);
    expect(profile).not.toBeNull();
    const client = profile!.client;
    expect(client.category).toBe('pregnant');
    expect(client.givenName).toBe('Ama');
    expect(client.familyName).toBe('Synthetic');
    expect(client.preferredName).toBe('Ama Pref');
    expect(client.sex).toBe('female');
    expect(client.dateOfBirth).toBe('1998-04-12');
    expect(client.pregnancyStatus).toBe('confirmed');
    expect(client.estimatedDeliveryDate).toBe('2026-11-01');
    expect(client.phoneNumber).toBe('0244123456');
    expect(client.community).toBe('Gushegu');
    expect(client.district).toBe('Gushegu');
    expect(client.region).toBe('Northern');
    expect(client.primaryFacilityId).toBe(facility.id);
    expect(client.consentStatus).toBe('recorded');
    expect(client.notes).toBe('SYNTHETIC note');
    expect(profile!.facility?.id).toBe(facility.id);
    expect(profile!.caregivers).toHaveLength(1);
    expect(profile!.caregivers[0]?.caregiver.givenName).toBe('Kofi');
    expect(profile!.caregivers[0]?.caregiver.phoneNumber).toBe('0200987654');
    expect(profile!.caregivers[0]?.relationship.relationshipType).toBe('guardian');

    const listed = await services.searchClients({
      query: 'Ama Pref',
      facilityId: facility.id,
    });
    expect(listed.some((item) => item.id === client.id)).toBe(true);
    await manager.close();
  });

  it('resolves opaque worker facility ids into local EntityId facilities', async () => {
    const { manager, services, repos } = await setup();
    const facility = await services.ensureAssignedFacility({
      facilityId: 'fac-dev-001',
      name: 'Demo CHPS Compound',
      region: 'Northern',
    });
    expect(facility.name).toBe('Demo CHPS Compound');
    expect(facility.externalCode).toBe('fac-dev-001');
    expect(facility.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const again = await services.ensureAssignedFacility({
      facilityId: 'fac-dev-001',
      name: 'Demo CHPS Compound',
    });
    expect(again.id).toBe(facility.id);

    const byCode = await repos.facilities.findByExternalCode('fac-dev-001');
    expect(byCode?.id).toBe(facility.id);
    await manager.close();
  });

  it('registers a client when draft still carries an opaque session facility id', async () => {
    const { manager, services, accountId } = await setup();
    const created = await services.registerClient({
      draft: baseDraft('fac-dev-001', {
        includeCaregiver: false,
        community: 'Tamale',
        region: 'Northern',
      }),
      accountId: 'dev-worker-001',
    });
    expect(created.client.primaryFacilityId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const listed = await services.searchClients({ facilityId: 'fac-dev-001' });
    expect(listed.some((item) => item.id === created.client.id)).toBe(true);
    expect(await services.countClients('fac-dev-001')).toBeGreaterThanOrEqual(1);
    await manager.close();
  });

  it('stores null phone when optional phone is left blank', async () => {
    const { manager, services, facility, accountId } = await setup();
    const created = await services.registerClient({
      draft: baseDraft(facility.id, {
        phoneNumber: '',
        phoneNotAvailable: false,
        includeCaregiver: false,
      }),
      accountId,
    });
    const profile = await services.getClientProfile(created.client.id);
    expect(profile?.client.phoneNumber).toBeNull();
    await manager.close();
  });

  it('stores null phone when marked not available', async () => {
    const { manager, services, facility, accountId } = await setup();
    const created = await services.registerClient({
      draft: baseDraft(facility.id, {
        phoneNumber: '0244000000',
        phoneNotAvailable: true,
        includeCaregiver: false,
      }),
      accountId,
    });
    expect(created.client.phoneNumber).toBeNull();
    await manager.close();
  });

  it('does not default consent to recorded', async () => {
    const { manager, services, facility, accountId } = await setup();
    const draft = baseDraft(facility.id, { consentStatus: null });
    await expect(services.registerClient({ draft, accountId })).rejects.toBeInstanceOf(
      RepositoryError,
    );
    const unknown = await services.registerClient({
      draft: baseDraft(facility.id, { consentStatus: 'unknown' }),
      accountId,
    });
    expect(unknown.client.consentStatus).toBe('unknown');
    expect(unknown.client.consentRecordedAt).toBeNull();
    await manager.close();
  });

  it('rolls back registration when a later transactional step fails', async () => {
    const { manager, repos, facility, accountId } = await setup();
    const originalEnqueue = repos.syncQueue.enqueue.bind(repos.syncQueue);
    let calls = 0;
    repos.syncQueue.enqueue = async (input) => {
      calls += 1;
      if (input.entityType === 'client') {
        throw new Error('forced-sync-failure');
      }
      return originalEnqueue(input);
    };

    const services = createClientServices(
      repos,
      { withTransaction: (task) => manager.withTransaction(task) },
      createSequentialIds(),
    );

    await expect(
      services.registerClient({
        draft: baseDraft(facility.id, {
          givenName: 'Rollback',
          familyName: 'Synthetic',
        }),
        accountId,
      }),
    ).rejects.toBeTruthy();

    const remaining = await repos.clients.search('rollback synthetic');
    expect(remaining).toHaveLength(0);
    expect(calls).toBeGreaterThan(0);
    await manager.close();
  });
});
