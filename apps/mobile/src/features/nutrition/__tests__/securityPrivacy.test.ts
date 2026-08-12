import { completeSyntheticChildAssessment, setupNutritionTest } from './helpers';

describe('nutrition security and privacy', () => {
  it('does not store answer values or measurement numbers in audit metadata', async () => {
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

    const events = await repos.auditEvents.listForEntity('nutritionAssessment', assessmentId);
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('10.5');
    expect(serialized).not.toContain('example_option_one');
    expect(serialized).not.toMatch(/givenName|familyName|clientCode/i);
    await manager.close();
  });

  it('fails closed starting assessments in production without pilot templates', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const result = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'production',
    });
    expect(result.kind).toBe('unavailable');
    await manager.close();
  });
});
