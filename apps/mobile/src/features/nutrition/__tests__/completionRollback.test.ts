import { completeSyntheticChildAssessment, setupNutritionTest } from './helpers';

describe('nutrition completion rollback', () => {
  it('keeps assessment draft when sync enqueue fails mid completeAssessment transaction', async () => {
    const { manager, repos, services, accountId, client } = await setupNutritionTest();
    const { assessmentId } = await completeSyntheticChildAssessment({
      services,
      repos,
      accountId,
      clientId: client.id,
    });

    const originalEnqueue = repos.syncQueue.enqueue.bind(repos.syncQueue);
    repos.syncQueue.enqueue = async (input) => {
      if (input.entityType === 'nutritionAssessment' && input.operation === 'update') {
        throw new Error('forced-nutrition-complete-sync-failure');
      }
      return originalEnqueue(input);
    };

    await expect(
      services.completeAssessment({
        assessmentId,
        accountId,
        confirmed: true,
        environment: 'development',
      }),
    ).rejects.toThrow(/Transaction failed|forced-nutrition-complete-sync-failure/);

    const draftAfter = await services.getDraft(assessmentId);
    expect(draftAfter?.assessment.status).toBe('draft');

    const referenceRows = await repos.nutritionAssessments.listReferenceResults(assessmentId);
    const guidanceRows = await repos.nutritionAssessments.listGuidanceResolutions(assessmentId);
    expect(referenceRows).toHaveLength(0);
    expect(guidanceRows).toHaveLength(0);

    const auditEvents = await repos.auditEvents.listForEntity(
      'nutritionAssessment',
      assessmentId,
    );
    expect(auditEvents.some((e) => e.eventType === 'nutrition_assessment_completed')).toBe(false);

    await manager.close();
  });
});
