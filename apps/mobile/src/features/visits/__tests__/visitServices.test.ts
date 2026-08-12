import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { RepositoryError } from '../../../data/repositories/errors/RepositoryError';
import { createVisitServices } from '../application/createVisitServices';

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
    name: 'SYNTHETIC Stage8 Clinic',
    region: 'Northern',
  });
  const accountId = '33333333-3333-4333-8333-333333333333';
  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'SYNTHETIC Visit Worker',
  });
  const client = await repos.clients.create({
    clientCode: 'SYN-V-001',
    category: 'pregnant',
    givenName: 'Ama',
    familyName: 'VisitSynthetic',
    primaryFacilityId: facility.id,
    accountId,
  });
  const services = createVisitServices(
    repos,
    { withTransaction: (task) => manager.withTransaction(task) },
    createSequentialIds(),
  );
  return { manager, repos, services, facility, accountId, client };
}

async function answerRequired(services: ReturnType<typeof createVisitServices>, visitId: string, accountId: string) {
  await services.recordScreeningAnswer({
    visitId,
    accountId,
    answer: {
      questionId: 'item_a1',
      state: 'answered',
      value: { kind: 'boolean', value: true },
    },
  });
  await services.recordScreeningAnswer({
    visitId,
    accountId,
    answer: {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: 'option_one' },
    },
  });
  await services.recordMeasurement({
    visitId,
    accountId,
    questionId: 'item_b1_weight',
    numericValue: 62.5,
    unit: 'kg',
    measurementType: 'weight',
  });
  await services.recordScreeningAnswer({
    visitId,
    accountId,
    answer: {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  });
}

describe('visit services', () => {
  it('starts a visit, saves draft answers, resumes, and lists history', async () => {
    const { manager, services, accountId, client } = await setup();
    const started = await services.startVisit({
      clientId: client.id,
      accountId,
      facilityId: client.primaryFacilityId,
    });
    expect(started.kind).toBe('started');
    expect(started.draft.template.developmentBanner).toContain('NOT CLINICAL GUIDANCE');

    const again = await services.startVisit({ clientId: client.id, accountId });
    expect(again.kind).toBe('existingDraft');
    expect(again.draft.encounter.id).toBe(started.draft.encounter.id);

    await services.recordScreeningAnswer({
      visitId: started.draft.encounter.id,
      accountId,
      answer: { questionId: 'item_a1', state: 'unknown' },
    });
    const saved = await services.saveVisitDraft({
      visitId: started.draft.encounter.id,
      accountId,
      progressSectionId: 'section-b',
    });
    expect(saved.progressSectionId).toBe('section-b');
    expect(saved.answers.find((a) => a.questionId === 'item_a1')?.state).toBe('unknown');

    const resumed = await services.resumeVisit(started.draft.encounter.id);
    expect(resumed?.encounter.status).toBe('inProgress');

    const history = await services.getClientVisitHistory(client.id);
    expect(history).toHaveLength(1);
    await manager.close();
  });

  it('completes screening transactionally with sync queue entries', async () => {
    const { manager, repos, services, accountId, client } = await setup();
    const started = await services.startVisit({ clientId: client.id, accountId });
    await answerRequired(services, started.draft.encounter.id, accountId);

    await expect(
      services.completeScreening({
        visitId: started.draft.encounter.id,
        accountId,
        confirmed: false,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);

    const completed = await services.completeScreening({
      visitId: started.draft.encounter.id,
      accountId,
      confirmed: true,
    });
    expect(completed.encounter.status).toBe('completed');
    expect(completed.screening.status).toBe('completed');
    expect(completed.syncItems.length).toBeGreaterThanOrEqual(2);

    const pending = await repos.syncQueue.listByState('pending');
    expect(pending.some((item) => item.entityType === 'encounter')).toBe(true);
    expect(pending.some((item) => item.entityType === 'screening')).toBe(true);

    const draftAfter = await services.getVisitDraft(started.draft.encounter.id);
    expect(draftAfter).toBeNull();
    await manager.close();
  });

  it('rolls back completion when a later transactional step fails', async () => {
    const { manager, repos, services, accountId, client } = await setup();
    const started = await services.startVisit({ clientId: client.id, accountId });
    await answerRequired(services, started.draft.encounter.id, accountId);

    const originalEnqueue = repos.syncQueue.enqueue.bind(repos.syncQueue);
    repos.syncQueue.enqueue = async (input) => {
      if (input.entityType === 'screening') {
        throw new Error('forced-sync-failure');
      }
      return originalEnqueue(input);
    };

    // Use default id generator so rollback path does not collide with sequential setup ids.
    const failingServices = createVisitServices(repos, {
      withTransaction: (task) => manager.withTransaction(task),
    });

    await expect(
      failingServices.completeScreening({
        visitId: started.draft.encounter.id,
        accountId,
        confirmed: true,
      }),
    ).rejects.toBeTruthy();

    const encounter = await repos.encounters.findById(started.draft.encounter.id);
    const screening = await repos.screenings.findByEncounterId(started.draft.encounter.id);
    expect(encounter?.status).not.toBe('completed');
    expect(screening?.status).not.toBe('completed');
    await manager.close();
  });

  it('abandons unfinished visits and supports provisional correction history', async () => {
    const { manager, repos, services, accountId, client } = await setup();
    const started = await services.startVisit({ clientId: client.id, accountId });
    await services.abandonVisit({
      visitId: started.draft.encounter.id,
      accountId,
    });
    const abandoned = await repos.encounters.findById(started.draft.encounter.id);
    expect(abandoned?.status).toBe('cancelled');

    const second = await services.startVisit({ clientId: client.id, accountId });
    expect(second.kind).toBe('started');
    await answerRequired(services, second.draft.encounter.id, accountId);
    await services.completeScreening({
      visitId: second.draft.encounter.id,
      accountId,
      confirmed: true,
    });

    await services.correctVisitRecord({
      visitId: second.draft.encounter.id,
      accountId,
      reasonCode: 'data_entry_correction',
      answer: { questionId: 'item_a1', state: 'notAssessed' },
    });
    const details = await services.getVisitDetails(second.draft.encounter.id);
    expect(details?.answers.find((a) => a.questionId === 'item_a1')?.state).toBe('notAssessed');
    const audits = await repos.auditEvents.listForEntity('encounter', second.draft.encounter.id);
    expect(audits.some((event) => event.eventType === 'visit_answer_corrected')).toBe(true);
    await manager.close();
  });

  it('does not treat unanswered required items as no', async () => {
    const { manager, services, accountId, client } = await setup();
    const started = await services.startVisit({ clientId: client.id, accountId });
    await services.recordScreeningAnswer({
      visitId: started.draft.encounter.id,
      accountId,
      answer: {
        questionId: 'item_a2',
        state: 'answered',
        value: { kind: 'option', value: 'option_one' },
      },
    });
    const review = await services.reviewScreening(started.draft.encounter.id);
    expect(review?.incompleteRequired).toContain('item_a1');
    await expect(
      services.completeScreening({
        visitId: started.draft.encounter.id,
        accountId,
        confirmed: true,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
    await manager.close();
  });
});
