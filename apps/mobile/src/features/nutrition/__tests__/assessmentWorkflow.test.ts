import { setupNutritionTest } from './helpers';

describe('nutrition assessment workflow', () => {
  it('starts, records unknown and notAssessed distinctly, saves draft, and completes with history', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    expect(started.kind).toBe('started');
    const assessmentId = started.draft.assessment.id;

    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'visible_wasting', state: 'unknown' },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: { questionId: 'height_cm', state: 'notAssessed' },
    });

    const draftAfterStates = await services.getDraft(assessmentId);
    expect(
      draftAfterStates?.answers.find((a) => a.questionId === 'visible_wasting')?.state,
    ).toBe('unknown');
    expect(
      draftAfterStates?.answers.find((a) => a.questionId === 'height_cm')?.state,
    ).toBe('notAssessed');

    await services.saveDraft({
      assessmentId,
      accountId,
      progressSectionId: 'section-measurements',
    });
    const resumed = await services.getDraft(assessmentId);
    expect(resumed?.assessment.progressSectionId).toBe('section-measurements');

    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'child_age_months',
        state: 'answered',
        value: { kind: 'number', value: 12 },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'child_sex',
        state: 'answered',
        value: { kind: 'option', value: 'male' },
      },
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'weight_kg',
      numericValue: 11,
      unit: 'kg',
      measurementType: 'weight',
    });
    await services.recordMeasurement({
      assessmentId,
      accountId,
      questionId: 'muac_cm',
      numericValue: 13.5,
      unit: 'cm',
      measurementType: 'muac',
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'bilateral_oedema',
        state: 'answered',
        value: { kind: 'boolean', value: false },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'currently_breastfeeding',
        state: 'answered',
        value: { kind: 'boolean', value: true },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'complementary_feeding',
        state: 'answered',
        value: { kind: 'option', value: 'yes' },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'meals_per_day',
        state: 'answered',
        value: { kind: 'option', value: '3' },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'mdd_food_groups_yesterday',
        state: 'answered',
        value: {
          kind: 'multipleOptions',
          values: [
            'grains_roots_tubers',
            'legumes_nuts',
            'flesh_foods',
            'eggs',
            'vitamin_a_fruits_vegetables',
            'breastmilk',
          ],
        },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'feeding_difficulties',
        state: 'answered',
        value: { kind: 'boolean', value: false },
      },
    });
    await services.recordAnswer({
      assessmentId,
      accountId,
      answer: {
        questionId: 'caregiver_counselled',
        state: 'answered',
        value: { kind: 'acknowledgement', value: true },
      },
    });

    const completed = await services.completeAssessment({
      assessmentId,
      accountId,
      confirmed: true,
      environment: 'development',
    });
    expect(completed.details.assessment.status).toBe('completed');

    const history = await services.getHistory(client.id);
    expect(history.some((row) => row.id === assessmentId && row.status === 'completed')).toBe(true);
    await manager.close();
  });

  it('requires confirmation to discard and complete', async () => {
    const { manager, services, accountId, client } = await setupNutritionTest();
    const started = await services.startAssessment({
      clientId: client.id,
      accountId,
      assessmentType: 'childNutrition',
      environment: 'development',
    });
    expect(started.kind).toBe('started');
    const assessmentId = started.draft.assessment.id;

    await expect(
      services.discardDraft({ assessmentId, accountId, confirmed: false }),
    ).rejects.toThrow(/confirmation/i);
    await expect(
      services.completeAssessment({ assessmentId, accountId, confirmed: false }),
    ).rejects.toThrow(/confirmation/i);

    await services.discardDraft({ assessmentId, accountId, confirmed: true });
    const afterDiscard = await services.getDraft(assessmentId);
    expect(afterDiscard).toBeNull();
    await manager.close();
  });
});
