import { setupNutritionTest, completeSyntheticChildAssessment } from './helpers';

describe('softDeleteAssessment', () => {
  it('soft deletes completed assessment and removes from history', async () => {
    const { manager, repos, services, accountId, client } = await setupNutritionTest();
    const { assessmentId } = await completeSyntheticChildAssessment({
      services,
      repos,
      accountId,
      clientId: client.id,
    });

    await services.completeAssessment({
      assessmentId,
      accountId,
      confirmed: true,
      environment: 'development',
    });

    await services.softDeleteAssessment({
      assessmentId,
      accountId,
      reason: 'Duplicate entry',
      confirmed: true,
    });

    const history = await services.getHistory(client.id);
    expect(history.some((row) => row.id === assessmentId)).toBe(false);

    const deleted = await repos.nutritionAssessments.findById(assessmentId);
    expect(deleted).toBeNull();

    await manager.close();
  });

  it('requires confirmation', async () => {
    const { manager, services, accountId, client, repos } = await setupNutritionTest();
    const { assessmentId } = await completeSyntheticChildAssessment({
      services,
      repos,
      accountId,
      clientId: client.id,
    });

    await services.completeAssessment({
      assessmentId,
      accountId,
      confirmed: true,
      environment: 'development',
    });

    await expect(
      services.softDeleteAssessment({
        assessmentId,
        accountId,
        reason: 'test',
        confirmed: false,
      }),
    ).rejects.toThrow(/confirmation/i);

    await manager.close();
  });
});
