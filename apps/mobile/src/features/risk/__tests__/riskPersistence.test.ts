import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { createVisitServices } from '../../visits/application/createVisitServices';
import { createRiskServices } from '../application/createRiskServices';
import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from '../content/development/syntheticDevPriorityRulePack';

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
    name: 'SYNTHETIC Stage9 Clinic',
    region: 'Northern',
  });
  const accountId = '33333333-3333-4333-8333-333333333333';
  await repos.localAccounts.upsert({
    accountId,
    role: 'worker',
    facilityId: facility.id,
    displayName: 'SYNTHETIC Risk Worker',
  });
  const client = await repos.clients.create({
    clientCode: 'SYN-R-001',
    category: 'pregnant',
    givenName: 'Ama',
    familyName: 'RiskSynthetic',
    primaryFacilityId: facility.id,
    accountId,
  });
  const visitServices = createVisitServices(
    repos,
    { withTransaction: (task) => manager.withTransaction(task) },
    createSequentialIds(),
  );
  const riskServices = createRiskServices(repos, {
    withTransaction: (task) => manager.withTransaction(task),
  });
  return { manager, repos, visitServices, riskServices, accountId, client };
}

async function completeSyntheticVisit(
  visitServices: ReturnType<typeof createVisitServices>,
  visitId: string,
  accountId: string,
  answers: {
    a1: boolean | 'unknown';
    a2: 'option_one' | 'option_two' | 'option_three';
    weight: number;
  },
) {
  if (answers.a1 === 'unknown') {
    await visitServices.recordScreeningAnswer({
      visitId,
      accountId,
      answer: { questionId: 'item_a1', state: 'unknown' },
    });
  } else {
    await visitServices.recordScreeningAnswer({
      visitId,
      accountId,
      answer: {
        questionId: 'item_a1',
        state: 'answered',
        value: { kind: 'boolean', value: answers.a1 },
      },
    });
  }
  await visitServices.recordScreeningAnswer({
    visitId,
    accountId,
    answer: {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: answers.a2 },
    },
  });
  await visitServices.recordMeasurement({
    visitId,
    accountId,
    questionId: 'item_b1_weight',
    numericValue: answers.weight,
    unit: 'kg',
    measurementType: 'weight',
  });
  await visitServices.recordScreeningAnswer({
    visitId,
    accountId,
    answer: {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  });
  await visitServices.completeScreening({
    visitId,
    accountId,
    confirmed: true,
  });
}

describe('risk persistence and transactions', () => {
  it('saves assessment, factors, acknowledgement, audit and sync queue', async () => {
    const { manager, repos, visitServices, riskServices, accountId, client } =
      await setup();
    const started = await visitServices.startVisit({ clientId: client.id, accountId });
    const visitId = started.draft.encounter.id;
    await completeSyntheticVisit(visitServices, visitId, accountId, {
      a1: true,
      a2: 'option_one',
      weight: 70,
    });

    const evaluation = await riskServices.evaluateForVisit({
      visitId,
      accountId,
      environment: 'development',
    });
    expect(evaluation.uiState).toBe('resultReady');
    expect(evaluation.outcome?.priority).toBe('red');
    expect(evaluation.outcome?.rulePackId).toBe(SYNTHETIC_DEV_PRIORITY_RULE_PACK.rulePackId);

    const saved = await riskServices.saveAcknowledgedResult({
      visitId,
      accountId,
      outcome: evaluation.outcome!,
      acknowledged: true,
    });
    expect(saved.assessment.confirmedByAccountId).toBe(accountId);
    expect(saved.assessment.isCurrent).toBe(true);
    expect(saved.factors.length).toBeGreaterThan(0);
    expect(saved.syncItems.some((item) => item.entityType === 'risk_assessment')).toBe(true);

    const current = await riskServices.getCurrentForVisit(visitId);
    expect(current?.assessment.id).toBe(saved.assessment.id);

    const audits = await repos.auditEvents.listForEntity(
      'risk_assessment',
      saved.assessment.id,
    );
    expect(audits.some((event) => event.eventType === 'priority_assessment_saved')).toBe(
      true,
    );
    await manager.close();
  });

  it('supersedes previous assessments on recalculation', async () => {
    const { manager, visitServices, riskServices, accountId, client } = await setup();
    const started = await visitServices.startVisit({ clientId: client.id, accountId });
    const visitId = started.draft.encounter.id;
    await completeSyntheticVisit(visitServices, visitId, accountId, {
      a1: false,
      a2: 'option_two',
      weight: 70,
    });
    const firstEval = await riskServices.evaluateForVisit({
      visitId,
      accountId,
      environment: 'development',
    });
    const first = await riskServices.saveAcknowledgedResult({
      visitId,
      accountId,
      outcome: firstEval.outcome!,
      acknowledged: true,
    });

    await visitServices.correctVisitRecord({
      visitId,
      accountId,
      reasonCode: 'data_entry_correction',
      answer: {
        questionId: 'item_a1',
        state: 'answered',
        value: { kind: 'boolean', value: true },
      },
    });

    const recalculated = await riskServices.recalculateForVisit({
      visitId,
      accountId,
      reason: 'screening_corrected',
      acknowledged: true,
      environment: 'development',
    });
    expect(recalculated.assessment.supersedesRiskAssessmentId).toBe(first.assessment.id);
    expect(recalculated.assessment.isCurrent).toBe(true);
    expect(recalculated.assessment.priority).toBe('red');

    const history = await riskServices.getHistoryForVisit(visitId);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some((item) => item.assessment.id === first.assessment.id)).toBe(true);
    expect(
      history.find((item) => item.assessment.id === first.assessment.id)?.assessment
        .isCurrent,
    ).toBe(false);
    await manager.close();
  });

  it('rolls back when sync queue insertion fails after assessment insert', async () => {
    const { manager, repos, visitServices, riskServices, accountId, client } =
      await setup();
    const started = await visitServices.startVisit({ clientId: client.id, accountId });
    const visitId = started.draft.encounter.id;
    await completeSyntheticVisit(visitServices, visitId, accountId, {
      a1: false,
      a2: 'option_one',
      weight: 70,
    });
    const evaluation = await riskServices.evaluateForVisit({
      visitId,
      accountId,
      environment: 'development',
    });

    const originalEnqueue = repos.syncQueue.enqueue.bind(repos.syncQueue);
    repos.syncQueue.enqueue = async (input) => {
      if (input.entityType === 'risk_assessment') {
        throw new Error('forced-risk-sync-failure');
      }
      return originalEnqueue(input);
    };

    await expect(
      riskServices.saveAcknowledgedResult({
        visitId,
        accountId,
        outcome: evaluation.outcome!,
        acknowledged: true,
      }),
    ).rejects.toBeTruthy();

    const current = await riskServices.getCurrentForVisit(visitId);
    expect(current).toBeNull();
    const pending = await repos.syncQueue.listByState('pending');
    expect(pending.some((item) => item.entityType === 'risk_assessment')).toBe(false);
    await manager.close();
  });

  it('rolls back when createWithFactors fails mid-transaction', async () => {
    const { manager, repos, visitServices, riskServices, accountId, client } =
      await setup();
    const started = await visitServices.startVisit({ clientId: client.id, accountId });
    const visitId = started.draft.encounter.id;
    await completeSyntheticVisit(visitServices, visitId, accountId, {
      a1: true,
      a2: 'option_one',
      weight: 70,
    });
    const evaluation = await riskServices.evaluateForVisit({
      visitId,
      accountId,
      environment: 'development',
    });

    repos.riskAssessments.createWithFactors = async () => {
      throw new Error('forced-assessment-insert-failure');
    };

    await expect(
      riskServices.saveAcknowledgedResult({
        visitId,
        accountId,
        outcome: evaluation.outcome!,
        acknowledged: true,
      }),
    ).rejects.toBeTruthy();

    const current = await riskServices.getCurrentForVisit(visitId);
    expect(current).toBeNull();
    await manager.close();
  });

  it('rolls back when acknowledgement update fails', async () => {
    const { manager, repos, visitServices, riskServices, accountId, client } =
      await setup();
    const started = await visitServices.startVisit({ clientId: client.id, accountId });
    const visitId = started.draft.encounter.id;
    await completeSyntheticVisit(visitServices, visitId, accountId, {
      a1: false,
      a2: 'option_two',
      weight: 70,
    });
    const evaluation = await riskServices.evaluateForVisit({
      visitId,
      accountId,
      environment: 'development',
    });

    repos.riskAssessments.acknowledge = async () => {
      throw new Error('forced-ack-failure');
    };

    await expect(
      riskServices.saveAcknowledgedResult({
        visitId,
        accountId,
        outcome: evaluation.outcome!,
        acknowledged: true,
      }),
    ).rejects.toBeTruthy();

    const current = await riskServices.getCurrentForVisit(visitId);
    expect(current).toBeNull();
    await manager.close();
  });
});
