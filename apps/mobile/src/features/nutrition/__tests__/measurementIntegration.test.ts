import { setupNutritionTest } from './helpers';

describe('nutrition measurement integration', () => {
  it('records measurement, rejects negative values, and preserves unit', async () => {
    const { manager, repos, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    expect(started.kind).toBe('started');
    const assessmentId = started.draft.assessment.id;

    await expect(
      services.recordMeasurement({
        assessmentId,
        accountId,
        questionId: 'example_measurement_c',
        numericValue: -1,
        unit: 'kg',
        measurementType: 'weight',
      }),
    ).rejects.toThrow(/validation|Measurement value failed/i);

    const draft = await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'example_measurement_c',
      numericValue: 8.25,
      unit: 'kg',
      measurementType: 'weight',
    });

    const measurement = draft.measurements.find((m) => m.measurementType === 'weight');
    expect(measurement?.unit).toBe('kg');
    expect(measurement?.numericValue).toBe(8.25);

    const answer = draft.answers.find((a) => a.questionId === 'example_measurement_c');
    expect(answer?.state).toBe('answered');

    const links = await repos.nutritionAssessments.listMeasurementLinks(assessmentId);
    expect(links.length).toBeGreaterThan(0);
    await manager.close();
  });
});
