import { RepositoryError } from '../repositories/errors/RepositoryError';
import { createTestDatabase } from './helpers/testDatabase';

describe('repository contracts', () => {
  describe('ClientRepository', () => {
    it('supports create/read/update/search/archive soft-delete', async () => {
      const { repos, manager } = await createTestDatabase();
      const facility = await repos.facilities.create({
        name: 'SYNTHETIC Client Clinic',
      });
      const created = await repos.clients.create({
        clientCode: 'SYN-C-100',
        category: 'pregnant',
        givenName: 'Ama',
        familyName: 'Synthetic',
        primaryFacilityId: facility.id,
      });
      expect(created.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(await repos.clients.findByClientCode('SYN-C-100')).toMatchObject({
        id: created.id,
      });
      const searched = await repos.clients.search('ama synthetic');
      expect(searched.map((c) => c.id)).toContain(created.id);

      await expect(
        repos.clients.create({
          clientCode: 'SYN-C-100',
          category: 'postnatal',
          givenName: 'Other',
          familyName: 'Synthetic',
        }),
      ).rejects.toBeInstanceOf(RepositoryError);

      const updated = await repos.clients.update({
        id: created.id,
        preferredName: 'Ama S.',
      });
      expect(updated.preferredName).toBe('Ama S.');
      expect(updated.localVersion).toBe(2);

      await repos.clients.archive(created.id);
      expect(await repos.clients.findById(created.id)).toBeNull();
      const archived = await repos.clients.findById(created.id, { includeDeleted: true });
      expect(archived?.isDeleted).toBe(true);

      // Active unique index allows reuse after soft-delete.
      const reused = await repos.clients.create({
        clientCode: 'SYN-C-100',
        category: 'postnatal',
        givenName: 'Other',
        familyName: 'Synthetic',
      });
      expect(reused.clientCode).toBe('SYN-C-100');

      await manager.close();
    });
  });

  describe('EncounterRepository', () => {
    it('creates drafts, completes, lists history, and rolls back invalid FK', async () => {
      const { repos, manager } = await createTestDatabase();
      const client = await repos.clients.create({
        clientCode: 'SYN-E-1',
        category: 'newborn',
        givenName: 'Baby',
        familyName: 'Synthetic',
      });
      const draft = await repos.encounters.createDraft({
        clientId: client.id,
        encounterType: 'newbornVisit',
      });
      expect(draft.status).toBe('draft');
      expect(await repos.encounters.findDraftById(draft.id)).not.toBeNull();

      const completed = await repos.encounters.complete(draft.id);
      expect(completed.status).toBe('completed');
      const history = await repos.encounters.listByClient(client.id);
      expect(history).toHaveLength(1);

      await expect(
        repos.encounters.createDraft({
          clientId: '99999999-9999-4999-8999-999999999999',
          encounterType: 'other',
        }),
      ).rejects.toMatchObject({ category: 'constraint' });

      await manager.withTransaction(async () => {
        await repos.clients.create({
          clientCode: 'SYN-E-TX',
          category: 'pregnant',
          givenName: 'Tx',
          familyName: 'Synthetic',
        });
        throw new Error('force-rollback');
      }).catch(() => undefined);

      expect(await repos.clients.findByClientCode('SYN-E-TX')).toBeNull();
      await manager.close();
    });
  });

  describe('ScreeningRepository', () => {
    it('saves typed answers and rejects invalid types', async () => {
      const { repos, manager } = await createTestDatabase();
      const client = await repos.clients.create({
        clientCode: 'SYN-S-1',
        category: 'pregnant',
        givenName: 'Screen',
        familyName: 'Synthetic',
      });
      const encounter = await repos.encounters.createDraft({
        clientId: client.id,
        encounterType: 'antenatalVisit',
      });
      const screening = await repos.screenings.create({
        encounterId: encounter.id,
        clientId: client.id,
        screeningType: 'antenatal',
      });
      await repos.screenings.saveAnswer({
        screeningId: screening.id,
        questionKey: 'synthetic.fever',
        valueType: 'boolean',
        booleanValue: true,
      });
      await repos.screenings.saveAnswer({
        screeningId: screening.id,
        questionKey: 'synthetic.notes',
        valueType: 'text',
        textValue: 'SYNTHETIC note',
      });
      const answers = await repos.screenings.listAnswers(screening.id);
      expect(answers).toHaveLength(2);

      await expect(
        repos.screenings.saveAnswer({
          screeningId: screening.id,
          questionKey: 'synthetic.bad',
          valueType: 'number',
          // intentionally missing numberValue
        }),
      ).rejects.toMatchObject({ category: 'validation' });

      await manager.close();
    });
  });

  describe('ReferralRepository', () => {
    it('creates draft with event history and ordered status updates', async () => {
      const { repos, manager } = await createTestDatabase();
      const facility = await repos.facilities.create({ name: 'SYNTHETIC Referral Clinic' });
      const client = await repos.clients.create({
        clientCode: 'SYN-R-1',
        category: 'postnatal',
        givenName: 'Ref',
        familyName: 'Synthetic',
        primaryFacilityId: facility.id,
      });
      const referral = await repos.referrals.createDraft({
        clientId: client.id,
        sourceFacilityId: facility.id,
        receivingFacilityId: facility.id,
        priority: 'amber',
        reasonSummary: 'SYNTHETIC reason',
      });
      await repos.referrals.addEvent({
        referralId: referral.id,
        eventType: 'caregiver_notified',
      });
      const updated = await repos.referrals.updateStatus(referral.id, 'created');
      expect(updated.status).toBe('created');
      const events = await repos.referrals.listEvents(referral.id);
      expect(events.length).toBeGreaterThanOrEqual(3);
      expect(events.map((e) => e.eventType)).toEqual(
        expect.arrayContaining(['draft_created', 'caregiver_notified', 'status_created']),
      );
      await repos.referrals.cancel(referral.id);
      expect((await repos.referrals.findById(referral.id))?.status).toBe('cancelled');
      await manager.close();
    });
  });

  describe('SyncQueueRepository', () => {
    it('enqueues, coalesces active duplicates, retries and marks outcomes', async () => {
      const { repos, manager } = await createTestDatabase();
      const client = await repos.clients.create({
        clientCode: 'SYN-Q-1',
        category: 'childUnderFive',
        givenName: 'Queue',
        familyName: 'Synthetic',
      });
      const item = await repos.syncQueue.enqueue({
        entityType: 'client',
        entityId: client.id,
        operation: 'create',
        payloadJson: '{"version":1}',
        payloadVersion: 1,
      });
      const coalesced = await repos.syncQueue.enqueue({
        entityType: 'client',
        entityId: client.id,
        operation: 'create',
        payloadJson: '{"version":2}',
        payloadVersion: 2,
      });
      expect(coalesced.id).toBe(item.id);
      expect(coalesced.payloadJson).toBe('{"version":2}');
      expect(coalesced.payloadVersion).toBe(2);
      expect(coalesced.state).toBe('pending');

      const attempted = await repos.syncQueue.incrementAttempts(item.id, 'network');
      expect(attempted.attemptCount).toBe(1);
      const retried = await repos.syncQueue.scheduleRetry(
        item.id,
        '2026-08-02T13:00:00.000Z',
      );
      expect(retried.state).toBe('pending');
      await repos.syncQueue.markFailed(item.id, 'timeout');
      expect((await repos.syncQueue.findById(item.id))?.state).toBe('failed');
      await repos.syncQueue.markConflict(item.id);
      expect((await repos.syncQueue.findById(item.id))?.state).toBe('conflict');
      await repos.syncQueue.markCompleted(item.id);
      expect((await repos.syncQueue.findById(item.id))?.state).toBe('completed');
      await manager.close();
    });
  });

  describe('AuditEventRepository', () => {
    it('records sanitised events and rejects prohibited fields', async () => {
      const { repos, manager } = await createTestDatabase();
      const event = await repos.auditEvents.record({
        eventType: 'record_created',
        entityType: 'client',
        entityId: '33333333-3333-4333-8333-333333333333',
        result: 'success',
        metadata: { marker: 'SYNTHETIC', operation: 'create' },
      });
      expect(event.metadataJson).toContain('SYNTHETIC');

      await expect(
        repos.auditEvents.record({
          eventType: 'bad',
          entityType: 'client',
          result: 'failed',
          metadata: { pin: '123456' },
        }),
      ).rejects.toMatchObject({ category: 'validation' });

      await manager.close();
    });

    it('lists recent events newest first and filters by type', async () => {
      const { repos, manager } = await createTestDatabase();
      await repos.auditEvents.record({
        eventType: 'client_registered',
        entityType: 'client',
        entityId: '33333333-3333-4333-8333-333333333333',
        result: 'success',
        metadata: { marker: 'first' },
      });
      await repos.auditEvents.record({
        eventType: 'client_updated',
        entityType: 'client',
        entityId: '33333333-3333-4333-8333-333333333333',
        result: 'success',
        metadata: { changedFields: 'community', fieldCount: 1 },
      });

      const recent = await repos.auditEvents.listRecent({ limit: 10 });
      expect(recent.length).toBeGreaterThanOrEqual(2);
      expect(recent[0]?.eventType).toBe('client_updated');

      const updatesOnly = await repos.auditEvents.listRecent({
        eventType: 'client_updated',
        limit: 10,
      });
      expect(updatesOnly.every((event) => event.eventType === 'client_updated')).toBe(true);

      await manager.close();
    });
  });

  describe('identity persistence', () => {
    it('keeps UUID stable across read', async () => {
      const { repos, manager } = await createTestDatabase();
      const created = await repos.clients.create({
        clientCode: 'SYN-ID-1',
        category: 'pregnant',
        givenName: 'Id',
        familyName: 'Synthetic',
      });
      const again = await repos.clients.findById(created.id);
      expect(again?.id).toBe(created.id);
      await manager.close();
    });
  });
});
